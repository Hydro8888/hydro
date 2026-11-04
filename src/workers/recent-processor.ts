/**
 * recent-processor.ts
 * One-off AI processing of the N most recent articles (default 30): Korean
 * title + summary, Korean body, and an AI image for articles without a usable
 * photo. Only what is missing is requested, so a re-run costs (almost) nothing.
 *
 * Used by: src/workers/process-recent-cli.ts  (npm run ai:recent)
 * Relative imports only — the tsx worker runtime has no `@/` alias.
 */

import type { PrismaClient } from '@prisma/client';
import { createAiClient, newApiStats, type ApiStats, type ChatClient } from '../lib/ai-client';
import { isValidArticleImage, normalizeImageUrl } from '../lib/utils';
import { translateTitleBatch } from './translator';
import { translateLongText } from './content-translator';
import { generateImages, type ImageClient } from './image-generator';
import type { TranslatableArticle } from './translator';
import {
  hasHangul,
  isKoreanLanguage,
  isMissingSummary,
  isStandardCategory,
  isTruncatedTranslation,
  isUntranslatedContent,
  isUntranslatedTitle,
} from './translation-text';

export interface RecentRow {
  id: number;
  originalUrl: string;
  titleOriginal: string;
  titleKo: string | null;
  summaryKo: string | null;
  contentOriginal: string | null;
  contentKo: string | null;
  language: string;
  categoryPrimary: string | null;
  imageUrl: string | null;
}

export interface WorkPlan {
  title: boolean;
  summary: boolean;
  body: boolean;
  image: boolean;
}

export interface PlanOptions {
  /** Translate again even when a Korean title / summary / body already exists. */
  retranslate?: boolean;
  /** Generate AI images for articles without a usable photo. */
  images?: boolean;
}

/** Pure: what this article still needs. Korean-language sources never need translation. */
export function planArticleWork(r: RecentRow, opts: PlanOptions = {}): WorkPlan {
  const korean = isKoreanLanguage(r.language);
  const hasBody = Array.from(r.contentOriginal ?? '').length > 30;
  const photo = normalizeImageUrl(r.imageUrl);
  return {
    title: !korean && (opts.retranslate ? true : isUntranslatedTitle(r.titleKo, r.titleOriginal, r.language)),
    summary: !korean && (opts.retranslate ? true : isMissingSummary(r.summaryKo, r.language)),
    body:
      !korean &&
      hasBody &&
      (opts.retranslate ||
        isUntranslatedContent(r.contentKo, r.contentOriginal, r.language) ||
        isTruncatedTranslation(r.contentKo, r.contentOriginal)),
    image: opts.images !== false && !(photo && isValidArticleImage(photo)),
  };
}

/** Rough request count for the cost preview (titles go 10 per request, bodies in ≤3000-char chunks). */
export function estimateRequests(rows: RecentRow[], plans: WorkPlan[]): { text: number; images: number } {
  const titleRows = plans.filter((p) => p.title || p.summary).length;
  let text = Math.ceil(titleRows / 10);
  rows.forEach((r, i) => {
    if (plans[i].body) text += Math.max(1, Math.ceil(Array.from(r.contentOriginal ?? '').length / 3000));
  });
  return { text, images: plans.filter((p) => p.image).length };
}

export interface ArticleOutcome {
  id: number;
  plan: WorkPlan;
  title?: boolean;
  summary?: boolean;
  body?: boolean;
  image?: boolean;
  /** Korean title after processing (for the report) */
  displayTitle: string;
}

export interface RecentResult {
  outcomes: ArticleOutcome[];
  api: ApiStats;
  imageRequests: number;
}

export interface ProcessOptions extends PlanOptions {
  limit?: number;
  dryRun?: boolean;
  textClient?: ChatClient | null;
  imageClient?: ImageClient | null;
  imageDir?: string;
  /** Pauses between API calls (tests set 0). */
  pauseMs?: number;
  log?: (line: string) => void;
}

export const RECENT_SELECT = {
  id: true,
  originalUrl: true,
  titleOriginal: true,
  titleKo: true,
  summaryKo: true,
  contentOriginal: true,
  contentKo: true,
  language: true,
  categoryPrimary: true,
  imageUrl: true,
} as const;

/** The N most recent active articles — same order as the site's latest-news list. */
export async function selectRecentArticles(prisma: PrismaClient, limit: number): Promise<RecentRow[]> {
  return prisma.article.findMany({
    where: { isActive: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
    select: RECENT_SELECT,
  });
}

export async function processRecentArticles(prisma: PrismaClient, opts: ProcessOptions = {}): Promise<RecentResult> {
  const log = opts.log ?? ((l: string) => console.log(l));
  const rows = await selectRecentArticles(prisma, opts.limit ?? 30);
  const plans = rows.map((r) => planArticleWork(r, opts));
  const outcomes: ArticleOutcome[] = rows.map((r, i) => ({ id: r.id, plan: plans[i], displayTitle: r.titleKo || r.titleOriginal }));
  const api = newApiStats();
  const result: RecentResult = { outcomes, api, imageRequests: 0 };
  if (opts.dryRun) return result;

  const textClient = opts.textClient === undefined ? createAiClient('text') : opts.textClient;
  const pauseMs = opts.pauseMs ?? 300;

  // ── 1. Titles + summaries (10 per request) ──────────────────────────────
  const titleIdx = plans.map((p, i) => (p.title || p.summary ? i : -1)).filter((i) => i >= 0);
  if (titleIdx.length > 0 && textClient) {
    log(`[recent] Translating ${titleIdx.length} title(s) / summaries…`);
    const results = await translateTitleBatch(titleIdx.map((i) => rows[i].titleOriginal), {
      client: textClient,
      stats: api,
      pauseMs,
    });
    for (let k = 0; k < titleIdx.length; k++) {
      const i = titleIdx[k];
      const r = rows[i];
      const t = results[k];
      const data: { titleKo?: string; summaryKo?: string; categoryPrimary?: string } = {};
      if (t?.titleKo) {
        if (plans[i].title) data.titleKo = t.titleKo;
        if (plans[i].summary && hasHangul(t.summaryKo)) data.summaryKo = t.summaryKo;
        if (!r.categoryPrimary || !isStandardCategory(r.categoryPrimary) || (r.categoryPrimary === 'general' && t.primary !== 'general')) {
          data.categoryPrimary = t.primary;
        }
      }
      if (Object.keys(data).length > 0) {
        await prisma.article.update({ where: { id: r.id }, data });
        if (data.titleKo) outcomes[i].displayTitle = data.titleKo;
      }
      if (plans[i].title) outcomes[i].title = data.titleKo !== undefined;
      if (plans[i].summary) outcomes[i].summary = data.summaryKo !== undefined;
    }
  }

  // ── 2. Bodies (whole text, ≤3000-char chunks; partial results never saved) ──
  for (let i = 0; i < rows.length; i++) {
    if (!plans[i].body || !textClient || api.billingBlocked) continue;
    const r = rows[i];
    log(`[recent] Translating body of #${r.id} (${Array.from(r.contentOriginal ?? '').length} chars)…`);
    const res = await translateLongText(r.contentOriginal ?? '', {
      client: textClient,
      language: r.language,
      stats: api,
      chunkPauseMs: pauseMs,
    });
    if (res.ok) await prisma.article.update({ where: { id: r.id }, data: { contentKo: res.text } });
    else log(`[recent] Body of #${r.id} not translated: ${res.reason}`);
    outcomes[i].body = res.ok;
  }

  // ── 3. AI images for articles without a usable photo ────────────────────
  const imageIdx = plans.map((p, i) => (p.image ? i : -1)).filter((i) => i >= 0);
  if (imageIdx.length > 0 && !api.billingBlocked) {
    const items = imageIdx.map((i) => ({
      originalUrl: rows[i].originalUrl,
      titleOriginal: rows[i].titleOriginal,
      categoryPrimary: rows[i].categoryPrimary,
      imageUrl: null as string | null,
    })) as unknown as TranslatableArticle[];
    result.imageRequests = items.length;
    await generateImages(items, {
      force: true,
      client: opts.imageClient === undefined ? createAiClient('image') : opts.imageClient,
      dir: opts.imageDir,
      pauseMs: pauseMs > 0 ? 1000 : 0,
      stats: api,
    });
    for (let k = 0; k < imageIdx.length; k++) {
      const i = imageIdx[k];
      const url = items[k].imageUrl;
      if (url) await prisma.article.update({ where: { id: rows[i].id }, data: { imageUrl: url } });
      outcomes[i].image = Boolean(url);
    }
  }

  return result;
}
