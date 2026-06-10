/**
 * translator.ts
 * Phase 1: Translates and categorizes article titles using xAI Grok.
 * Processes articles in chunks of 10 to stay within token limits.
 *
 * Phase 2 (content translation) → content-translator.ts
 * Phase 3 (image generation)    → image-generator.ts
 */

import OpenAI from 'openai';
import type { NormalizedArticle } from './normalizer';
import { xaiTextBreaker } from '../lib/circuit-breaker';
import { retryWithBackoff } from '../lib/retry';

// ---------------------------------------------------------------------------
// Inline batchTranslateAndCategorize to avoid @/ alias issues in tsx runner
// ---------------------------------------------------------------------------

const CHUNK_SIZE = 10;

export interface TranslationResult {
  titleKo: string;
  summaryKo: string;
  primary: string;
  secondary: string;
}

function buildClient(): OpenAI | null {
  if (!process.env.XAI_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
  });
}

const EMPTY_RESULT: TranslationResult = { titleKo: '', summaryKo: '', primary: 'general', secondary: '' };

async function translateChunk(
  client: OpenAI,
  model: string,
  articles: Array<{ title: string; snippet?: string }>,
): Promise<TranslationResult[]> {
  const titlesText = articles.map((a, i) => `${i + 1}. ${a.title}`).join('\n');

  const res = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `당신은 뉴스 처리 전문가입니다. 번호가 매겨진 각 뉴스 제목에 대해:
1. 한국어 번역 제목 (titleKo)
2. 한국어 1문장 요약 (summaryKo)
3. 카테고리 분류 (politics/economy/market/business/ai-tech/semiconductor/automotive/energy/society/culture/entertainment/sports/science/health/world/general)

반드시 각 항목에 입력 번호를 "idx" 필드로 포함한 JSON 배열로만 응답하세요:
[{"idx":1,"titleKo":"...","summaryKo":"...","primary":"...","secondary":"..."}]
정확히 ${articles.length}개의 항목을 반환하세요. 설명이나 코드블록 없이 JSON만 출력하세요.`,
      },
      { role: 'user', content: titlesText },
    ],
    max_tokens: articles.length * 200,
    temperature: 0.2,
  });

  // Strip markdown code fences some models wrap around JSON
  const text = (res.choices[0]?.message?.content?.trim() ?? '').replace(/```(?:json)?/gi, '');
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array found in model response');

  const parsed: unknown = JSON.parse(match[0]);
  if (!Array.isArray(parsed)) throw new Error('Model response is not a JSON array');

  // Map results by their "idx" field (1-based); fall back to array position.
  // A count mismatch must NOT wipe the whole chunk anymore — salvage what
  // matched and only throw when nothing is usable (so retryWithBackoff fires).
  const out: TranslationResult[] = articles.map(() => ({ ...EMPTY_RESULT }));
  let matched = 0;

  parsed.forEach((item: unknown, pos: number) => {
    if (typeof item !== 'object' || item === null) return;
    const rec = item as Record<string, unknown>;
    const idxRaw = rec.idx;
    const i = typeof idxRaw === 'number' && Number.isInteger(idxRaw) ? idxRaw - 1 : pos;
    const titleKo = typeof rec.titleKo === 'string' ? rec.titleKo.trim() : '';
    if (i < 0 || i >= out.length || !titleKo) return;
    out[i] = {
      titleKo,
      summaryKo: typeof rec.summaryKo === 'string' ? rec.summaryKo.trim() : '',
      primary: typeof rec.primary === 'string' && rec.primary ? rec.primary : 'general',
      secondary: typeof rec.secondary === 'string' ? rec.secondary : '',
    };
    matched++;
  });

  if (matched === 0) throw new Error('No usable translations in model response');
  if (matched < articles.length) {
    console.warn(
      `[translator] Salvaged ${matched}/${articles.length} translations in chunk — rest will be backfilled`,
    );
  }
  return out;
}

/**
 * Translates an arbitrary list of titles in chunks of {@link CHUNK_SIZE} with
 * circuit-breaker + retry. Returns one result per input title (failed chunks
 * yield empty placeholders). Shared by the collection pipeline and the
 * translation backfill worker.
 */
export async function translateTitleBatch(titles: string[]): Promise<TranslationResult[]> {
  if (titles.length === 0) return [];

  const client = buildClient();
  if (!client) {
    console.warn('[translator] XAI_API_KEY not set — skipping translation');
    return titles.map(() => ({ ...EMPTY_RESULT }));
  }

  const model = process.env.XAI_MODEL || 'grok-4-1-fast';
  const results: TranslationResult[] = [];

  for (let i = 0; i < titles.length; i += CHUNK_SIZE) {
    const chunk = titles.slice(i, i + CHUNK_SIZE);
    const chunkLabel = `[${i + 1}–${Math.min(i + CHUNK_SIZE, titles.length)}/${titles.length}]`;

    let translations: TranslationResult[];
    try {
      translations = await retryWithBackoff(
        () =>
          xaiTextBreaker.execute(() =>
            translateChunk(client, model, chunk.map((title) => ({ title }))),
          ),
        { maxRetries: 2, baseDelay: 1500 },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[translator] Chunk ${chunkLabel} failed: ${message}`);
      translations = chunk.map(() => ({ ...EMPTY_RESULT }));
    }

    results.push(...translations);
    console.log(`[translator] Translated chunk ${chunkLabel}`);

    // Small pause between chunks to be polite to the API
    if (i + CHUNK_SIZE < titles.length) {
      await new Promise((r) => setTimeout(r, 300));
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
 *   - titleKo           — Korean-translated headline
 *   - summaryKo         — Korean one-sentence summary
 *   - categoryPrimary   — primary category slug
 *   - categorySecondary — secondary category slug (may be empty)
 *
 * Articles are processed in chunks of {@link CHUNK_SIZE}.
 * Uses CircuitBreaker and retryWithBackoff for resilience.
 * Any chunk that fails after retries is silently skipped (fields remain empty strings).
 */
export async function translateArticles(
  articles: TranslatableArticle[],
): Promise<TranslatableArticle[]> {
  if (articles.length === 0) return articles;

  const translations = await translateTitleBatch(articles.map((a) => a.titleOriginal));

  return articles.map((a, i) => {
    const t = translations[i];
    return {
      ...a,
      titleKo: t?.titleKo ?? '',
      summaryKo: t?.summaryKo ?? '',
      categoryPrimary: t?.primary ?? 'general',
      categorySecondary: t?.secondary ?? '',
    };
  });
}
