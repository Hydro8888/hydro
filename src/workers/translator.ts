/**
 * translator.ts
 * Phase 1: Translates and categorizes article titles using xAI Grok.
 * Processes articles in chunks of 10 to stay within token limits.
 *
 * Phase 2 (content translation) → content-translator.ts
 * Phase 3 (image generation)    → image-generator.ts
 *
 * Failure handling (the honest-data rule: never save an incomplete translation):
 *  - Only the HTTP call goes through retry + circuit breaker (xai-client.chatCompletion).
 *  - The response is salvaged object by object (translation-text.salvageTitleItems);
 *    a titleKo is accepted only when it contains Hangul and differs from the original.
 *  - Items the model dropped / echoed / cut off are re-requested in smaller
 *    groups (halves, then single titles). A single title that is still
 *    rejected is given up (empty result → stays NULL in the DB).
 *  - A chunk that failed at the HTTP level is NOT split (no request storm during an outage).
 */

import type { NormalizedArticle } from './normalizer';
import {
  chatCompletion,
  createXaiClient,
  newApiStats,
  type ApiStats,
  type ChatClient,
} from '../lib/xai-client';
import {
  hasHangul,
  isKoreanLanguage,
  normalizeCategorySlug,
  normalizeSecondaryCategory,
  salvageTitleItems,
} from './translation-text';

const CHUNK_SIZE = 10;
/** Re-request depth for dropped items: 10 → halves → … → single titles. */
const MAX_SPLIT_DEPTH = 3;

export interface TranslationResult {
  titleKo: string;
  summaryKo: string;
  primary: string;
  secondary: string;
  /** Set when titleKo is empty: 'http' = API failure, 'rejected' = model output unusable. */
  failure?: 'http' | 'rejected';
}

const EMPTY_RESULT: TranslationResult = { titleKo: '', summaryKo: '', primary: 'general', secondary: '' };

/**
 * True when the model actually produced a Korean translation.
 * Guards against the model echoing the source title back verbatim —
 * without this, an English "translation" gets saved as titleKo and the
 * article looks permanently untranslated to users.
 */
export function looksTranslated(titleKo: string, original: string): boolean {
  const t = titleKo.trim();
  if (!t) return false;
  if (t === original.trim()) return false;
  return hasHangul(t);
}

export interface TitleBatchOptions {
  /** Inject a client (tests). Default: createXaiClient('text'). */
  client?: ChatClient | null;
  model?: string;
  /** Accumulates { apiCalls, apiFailures } across calls (backfill diagnostics). */
  stats?: ApiStats;
  /** Pause between top-level chunks (default 300ms). */
  pauseMs?: number;
}

interface ChunkContext {
  client: ChatClient;
  model: string;
  stats: ApiStats;
}

const SYSTEM_PROMPT = (n: number) => `당신은 뉴스 처리 전문가입니다. 번호가 매겨진 각 뉴스 제목(영어·일본어·중국어 등 외국어)에 대해:
1. 한국어 번역 제목 (titleKo)
2. 한국어 1문장 요약 (summaryKo)
3. 카테고리 분류 (politics/economy/market/business/ai-tech/semiconductor/automotive/energy/society/culture/entertainment/sports/science/health/world/general)

반드시 각 항목에 입력 번호를 "idx" 필드로 포함한 JSON 배열로만 응답하세요:
[{"idx":1,"titleKo":"...","summaryKo":"...","primary":"...","secondary":"..."}]
정확히 ${n}개의 항목을 반환하세요. 설명이나 코드블록 없이 JSON만 출력하세요.`;

/**
 * Translates `titles` (≤ CHUNK_SIZE) and re-requests whatever was not usable.
 * Never throws.
 */
async function translateGroup(
  ctx: ChunkContext,
  titles: string[],
  depth: number,
): Promise<TranslationResult[]> {
  const out: TranslationResult[] = titles.map(() => ({ ...EMPTY_RESULT, failure: 'rejected' as const }));

  let content: string;
  let finishReason: string | null;
  try {
    ({ content, finishReason } = await chatCompletion(
      ctx.client,
      {
        model: ctx.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT(titles.length) },
          { role: 'user', content: titles.map((t, i) => `${i + 1}. ${t}`).join('\n') },
        ],
        // 320/item: Korean title+summary+JSON overhead can exceed 200
        max_tokens: titles.length * 320,
        temperature: 0.2,
      },
      ctx.stats,
      'translator',
    ));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[translator] Request for ${titles.length} title(s) failed: ${message}`);
    return titles.map(() => ({ ...EMPTY_RESULT, failure: 'http' as const }));
  }

  if (finishReason === 'length') {
    console.warn(`[translator] Response cut at max_tokens (${titles.length} title(s)) — salvaging complete items`);
  }

  const items = salvageTitleItems(content);
  const accepted = new Array<boolean>(titles.length).fill(false);
  items.forEach((item, pos) => {
    const i = item.idx !== undefined ? item.idx - 1 : pos;
    if (i < 0 || i >= titles.length || accepted[i]) return;
    const titleKo = (item.titleKo ?? '').trim();
    // Reject untranslated echoes — leave empty so the backfill retries later
    if (!looksTranslated(titleKo, titles[i])) return;
    const summary = (item.summaryKo ?? '').trim();
    out[i] = {
      titleKo,
      summaryKo: hasHangul(summary) ? summary : '',
      primary: normalizeCategorySlug(item.primary),
      secondary: normalizeSecondaryCategory(item.secondary),
    };
    accepted[i] = true;
  });

  const missing = titles.map((_, i) => i).filter((i) => !accepted[i]);
  if (missing.length === 0) return out;

  if (titles.length === 1 || depth >= MAX_SPLIT_DEPTH) {
    if (titles.length === 1) {
      console.warn(`[translator] Model returned no usable translation for "${titles[0].slice(0, 60)}" — left untranslated`);
    }
    return out;
  }

  console.warn(
    `[translator] ${titles.length - missing.length}/${titles.length} usable — re-requesting ${missing.length} dropped title(s)`,
  );

  // Last level → single titles; otherwise halves.
  const groups: number[][] = [];
  if (missing.length === 1 || depth + 1 >= MAX_SPLIT_DEPTH) {
    for (const i of missing) groups.push([i]);
  } else {
    const half = Math.ceil(missing.length / 2);
    groups.push(missing.slice(0, half), missing.slice(half));
  }

  for (const group of groups) {
    const sub = await translateGroup(ctx, group.map((i) => titles[i]), depth + 1);
    group.forEach((origIdx, k) => {
      out[origIdx] = sub[k];
    });
  }
  return out;
}

/**
 * Translates an arbitrary list of titles in chunks of {@link CHUNK_SIZE}.
 * Returns one result per input title (unusable items yield empty titleKo with
 * a `failure` reason). Shared by the collection pipeline and the backfill.
 */
export async function translateTitleBatch(
  titles: string[],
  opts: TitleBatchOptions = {},
): Promise<TranslationResult[]> {
  if (titles.length === 0) return [];

  const client = opts.client === undefined ? createXaiClient('text') : opts.client;
  if (!client) {
    console.warn('[translator] XAI_API_KEY not set — skipping translation');
    return titles.map(() => ({ ...EMPTY_RESULT, failure: 'http' as const }));
  }

  const ctx: ChunkContext = {
    client,
    model: opts.model || process.env.XAI_MODEL || 'grok-4-1-fast',
    stats: opts.stats ?? newApiStats(),
  };
  const pauseMs = opts.pauseMs ?? 300;
  const results: TranslationResult[] = [];

  for (let i = 0; i < titles.length; i += CHUNK_SIZE) {
    const chunk = titles.slice(i, i + CHUNK_SIZE);
    const chunkLabel = `[${i + 1}–${Math.min(i + CHUNK_SIZE, titles.length)}/${titles.length}]`;

    const translations = await translateGroup(ctx, chunk, 0);
    results.push(...translations);

    const ok = translations.filter((t) => t.titleKo).length;
    if (ok > 0) {
      console.log(`[translator] Translated chunk ${chunkLabel} (${ok}/${chunk.length})`);
    } else {
      console.error(`[translator] Chunk ${chunkLabel} produced no usable translation`);
    }

    // Small pause between chunks to be polite to the API
    if (pauseMs > 0 && i + CHUNK_SIZE < titles.length) {
      await new Promise((r) => setTimeout(r, pauseMs));
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type TranslatableArticle = NormalizedArticle & {
  titleKo?: string;
  summaryKo?: string;
  contentKo?: string;
  categoryPrimary?: string;
  categorySecondary?: string;
};

/**
 * Phase 1: Accepts an array of normalized articles and enriches each one with:
 *   - titleKo           — Korean-translated headline ('' when unusable)
 *   - summaryKo         — Korean one-sentence summary ('' unless it is Korean)
 *   - categoryPrimary   — one of the 16 standard slugs
 *   - categorySecondary — standard slug or ''
 */
export async function translateArticles(
  articles: TranslatableArticle[],
  opts: TitleBatchOptions = {},
): Promise<TranslatableArticle[]> {
  if (articles.length === 0) return articles;

  // Korean-language sources need no translation — pass titles through so they
  // never sit in the "untranslated" backlog or burn API calls.
  const results: TranslatableArticle[] = new Array(articles.length);
  const toTranslate: number[] = [];
  articles.forEach((a, i) => {
    if (isKoreanLanguage(a.language)) {
      results[i] = {
        ...a,
        titleKo: a.titleOriginal,
        summaryKo: a.summaryKo ?? '',
        categoryPrimary: normalizeCategorySlug(a.categoryPrimary),
        categorySecondary: normalizeSecondaryCategory(a.categorySecondary),
      };
    } else {
      toTranslate.push(i);
    }
  });

  const translations = await translateTitleBatch(
    toTranslate.map((i) => articles[i].titleOriginal),
    opts,
  );

  toTranslate.forEach((origIdx, j) => {
    const t = translations[j];
    results[origIdx] = {
      ...articles[origIdx],
      titleKo: t?.titleKo ?? '',
      summaryKo: t?.summaryKo ?? '',
      categoryPrimary: t?.primary ?? 'general',
      categorySecondary: t?.secondary ?? '',
    };
  });

  return results;
}
