/**
 * content-translator.ts
 * Phase 2: Translates full article content (contentOriginal → contentKo).
 *
 * The whole original (≤ 8000 chars from the scraper/normalizer) is translated —
 * no more silent cut at 6000 chars (D18). Long bodies are split into chunks of
 * ≤ 3000 chars along paragraph / sentence boundaries; a chunk answered with
 * finish_reason "length" is split further and re-requested (D19). If any chunk
 * still fails, the article gets NO contentKo at all: a partial translation is
 * never stored, so the article page shows "summary + original" honestly.
 */

import type { TranslatableArticle } from './translator';
import {
  chatCompletion,
  createXaiClient,
  newApiStats,
  type ApiStats,
  type ChatClient,
} from '../lib/xai-client';
import {
  hasHangul,
  isMostlyKorean,
  normalizeLanguageTag,
  normalizeParagraphs,
  splitForTranslation,
} from './translation-text';

export const CONTENT_CHUNK_CHARS = 3000;
/** finish_reason "length" re-splits: chunk → halves, at most this many levels. */
const MAX_LENGTH_SPLIT_DEPTH = 4;
const MIN_SPLIT_CHARS = 200;

export type LongTextResult =
  | { ok: true; text: string }
  | { ok: false; reason: string; /** true when the API itself failed (not the model output) */ http: boolean };

export interface LongTextOptions {
  client: ChatClient;
  model?: string;
  language?: string | null;
  maxChars?: number;
  stats?: ApiStats;
  /** Pause between chunk requests (default 300ms). */
  chunkPauseMs?: number;
}

function languageName(lang: string | null | undefined): string {
  switch (normalizeLanguageTag(lang)) {
    case 'en':
      return '영어';
    case 'ja':
      return '일본어';
    case 'zh':
      return '중국어';
    default:
      return '외국어';
  }
}

// NOTE: the body prompt must not contain the words used by the title prompt
// ("idx", the Korean word for headline) — the QA mock server routes on them.
function systemPrompt(lang: string | null | undefined): string {
  return `당신은 뉴스 기사 번역 전문가입니다. 주어진 ${languageName(lang)} 뉴스 기사 본문(일부분일 수 있음)을 자연스러운 한국어로 번역하세요.

규칙:
- 뉴스 기사 스타일의 격식체 사용 (예: ~했다, ~이다)
- 고유명사(인명, 지명, 기관명)는 원문 그대로 유지하거나 널리 알려진 한국어 표기 사용
- 문단 구분은 줄바꿈 하나로 유지하고, 문단 수를 바꾸지 마세요 (문단을 합치거나 나누지 말 것)
- 내용을 빠짐없이 모두 번역하세요
- 설명 없이 번역문만 출력하세요`;
}

class ChunkFailure extends Error {
  constructor(message: string, readonly http: boolean) {
    super(message);
  }
}

const sleep = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

/** Translates `text` chunk by chunk; throws ChunkFailure on the first unrecoverable chunk. */
async function translateSegments(
  text: string,
  maxChars: number,
  depth: number,
  opts: Required<Pick<LongTextOptions, 'client' | 'model' | 'chunkPauseMs'>> & {
    language?: string | null;
    stats: ApiStats;
    first: { value: boolean };
  },
): Promise<string> {
  const chunks = splitForTranslation(text, maxChars);
  let out = '';

  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];
    if (!opts.first.value) await sleep(opts.chunkPauseMs);
    opts.first.value = false;

    let result: { content: string; finishReason: string | null };
    try {
      result = await chatCompletion(
        opts.client,
        {
          model: opts.model,
          messages: [
            { role: 'system', content: systemPrompt(opts.language) },
            { role: 'user', content: chunk.text },
          ],
          max_tokens: 4000,
          temperature: 0.3,
        },
        opts.stats,
        'content-translator',
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ChunkFailure(`request failed: ${msg}`, true);
    }

    let translated: string;
    if (result.finishReason === 'length') {
      const len = chunk.text.length;
      const nextMax = Math.max(MIN_SPLIT_CHARS, Math.floor(len / 2));
      if (depth >= MAX_LENGTH_SPLIT_DEPTH || len <= MIN_SPLIT_CHARS || nextMax >= len) {
        throw new ChunkFailure(`output cut by max_tokens on a ${len}-char segment that cannot be split further`, false);
      }
      console.warn(`[content-translator] Output cut (finish_reason=length) on ${len} chars — re-splitting at ${nextMax}`);
      translated = await translateSegments(chunk.text, nextMax, depth + 1, opts);
    } else {
      translated = result.content.trim();
      if (!translated) throw new ChunkFailure('empty response', false);
      if (!hasHangul(translated)) throw new ChunkFailure('response has no Korean text (echo)', false);
    }

    // A fragment of an over-long paragraph (or a one-paragraph chunk) must
    // stay one paragraph; otherwise keep the paragraph breaks, one '\n' each.
    const singleParagraph = chunk.fragment || !chunk.text.includes('\n');
    const piece = singleParagraph
      ? translated.split('\n').map((l) => l.trim()).filter(Boolean).join(' ')
      : normalizeParagraphs(translated);

    out += (out ? chunk.joinWith : '') + piece;
  }

  return out;
}

/**
 * Translates a whole body. `{ ok: true, text }` only when EVERY chunk was
 * translated completely; otherwise `{ ok: false }` and nothing should be saved.
 */
export async function translateLongText(text: string, opts: LongTextOptions): Promise<LongTextResult> {
  if (!text || !text.trim()) return { ok: false, reason: 'empty input', http: false };
  try {
    const translated = await translateSegments(text, opts.maxChars ?? CONTENT_CHUNK_CHARS, 0, {
      client: opts.client,
      model: opts.model || process.env.XAI_MODEL || 'grok-4-1-fast',
      chunkPauseMs: opts.chunkPauseMs ?? 300,
      language: opts.language,
      stats: opts.stats ?? newApiStats(),
      first: { value: true },
    });
    if (!translated || !hasHangul(translated)) return { ok: false, reason: 'no Korean output', http: false };
    return { ok: true, text: translated };
  } catch (err) {
    if (err instanceof ChunkFailure) return { ok: false, reason: err.message, http: err.http };
    return { ok: false, reason: err instanceof Error ? err.message : String(err), http: false };
  }
}

export interface ContentTranslateOptions {
  client?: ChatClient | null;
  model?: string;
  stats?: ApiStats;
  /** Pause between articles (default 500ms). */
  articlePauseMs?: number;
  chunkPauseMs?: number;
}

/**
 * Translates article body content from original language to Korean.
 * Only processes articles that have contentOriginal longer than 30 chars.
 * Sets contentKo to the complete translation, or '' when it failed (→ NULL in DB).
 */
export async function translateContent(
  articles: TranslatableArticle[],
  opts: ContentTranslateOptions = {},
): Promise<TranslatableArticle[]> {
  const client = opts.client === undefined ? createXaiClient('text') : opts.client;
  if (!client) {
    console.warn('[content-translator] XAI_API_KEY not set — skipping content translation');
    return articles;
  }

  const articlesWithContent: TranslatableArticle[] = [];
  for (const a of articles) {
    if (!a.contentOriginal || a.contentOriginal.length <= 30) continue;
    // Content that is already Korean needs no API call — passing it through as
    // contentKo also removes it from the "missing translation" backlog.
    if (isMostlyKorean(a.contentOriginal)) {
      a.contentKo = a.contentOriginal;
      continue;
    }
    articlesWithContent.push(a);
  }

  if (articlesWithContent.length === 0) {
    return articles;
  }

  console.log(
    `[content-translator] Translating content for ${articlesWithContent.length} articles...`,
  );

  const articlePauseMs = opts.articlePauseMs ?? 500;
  for (let i = 0; i < articlesWithContent.length; i++) {
    const article = articlesWithContent[i];
    const res = await translateLongText(article.contentOriginal || '', {
      client,
      model: opts.model,
      language: article.language,
      stats: opts.stats,
      chunkPauseMs: opts.chunkPauseMs,
    });
    if (res.ok) {
      article.contentKo = res.text;
    } else {
      console.warn(
        `[content-translator] Not saved "${article.titleOriginal.slice(0, 40)}": ${res.reason}`,
      );
      article.contentKo = '';
    }

    if (i < articlesWithContent.length - 1) await sleep(articlePauseMs);
  }

  console.log(`[content-translator] Content translation complete`);
  return articles;
}
