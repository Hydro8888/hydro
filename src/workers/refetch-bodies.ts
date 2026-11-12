/**
 * refetch-bodies.ts
 * Repairs articles stored with only the feed's teaser as their body: fetches
 * the article page again with the current extractor and, when it yields the
 * full article, stores it and translates it (the old translation covered only
 * the teaser).
 *
 * Sites that refuse automated access are respected: after a few empty results
 * in a row from one host, the rest of that host is skipped for the run.
 *
 * Used by src/workers/refetch-bodies-cli.ts (npm run content:refetch).
 * Relative imports only — the tsx worker runtime has no `@/` alias.
 */

import type { PrismaClient } from '@prisma/client';
import { fetchArticlePage } from './scraper';
import { shouldReplaceBody } from './article-extract';
import { translateLongText } from './content-translator';
import { createAiClient, newApiStats, type ApiStats, type ChatClient } from '../lib/ai-client';
import { reflowParagraphs } from '../lib/paragraphs';
import { SHORT_BODY_CHARS } from '../lib/excerpt';

/** Empty results in a row from one host before the host is skipped for this run. */
export const HOST_SKIP_AFTER = 3;

export interface RefetchRow {
  id: number;
  originalUrl: string;
  contentOriginal: string | null;
  language: string;
  sourceName: string;
}

export interface RefetchOutcome {
  id: number;
  source: string;
  before: number;
  after: number;
  result: 'improved' | 'unchanged' | 'unavailable' | 'skipped-host';
  translated?: boolean;
}

export interface RefetchOptions {
  limit?: number;
  dryRun?: boolean;
  translate?: boolean;
  source?: string;
  /** Inject for tests. */
  fetchPage?: (url: string) => Promise<{ content: string }>;
  textClient?: ChatClient | null;
  pauseMs?: number;
  log?: (line: string) => void;
}

export interface RefetchResult {
  candidates: number;
  outcomes: RefetchOutcome[];
  api: ApiStats;
}

/** Active articles whose original is a teaser (ends in "…" / "...", or shorter than an article), newest first. */
export async function selectTeaserArticles(prisma: PrismaClient, limit: number, source?: string): Promise<RefetchRow[]> {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: number; originalUrl: string; contentOriginal: string | null; language: string; sourceName: string }>>(
    `SELECT a.id, a."originalUrl", a."contentOriginal", a.language, s."sourceName"
       FROM "Article" a JOIN "Source" s ON s.id = a."sourceId"
      WHERE a."isActive"
        AND (length(coalesce(a."contentOriginal", '')) < $1
             OR a."contentOriginal" ~ '(\\.\\.\\.|…|\\[\\s*(…|\\.\\.\\.)\\s*\\])\\s*$')
        AND ($3::text IS NULL OR s."sourceName" = $3)
      ORDER BY a."createdAt" DESC, a.id DESC
      LIMIT $2`,
    SHORT_BODY_CHARS,
    limit,
    source ?? null,
  );
  return rows;
}

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

export async function refetchTeaserBodies(prisma: PrismaClient, opts: RefetchOptions = {}): Promise<RefetchResult> {
  const log = opts.log ?? ((l: string) => console.log(l));
  const rows = await selectTeaserArticles(prisma, opts.limit ?? 300, opts.source);
  const api = newApiStats();
  const result: RefetchResult = { candidates: rows.length, outcomes: [], api };
  if (opts.dryRun) return result;

  const fetchPage = opts.fetchPage ?? fetchArticlePage;
  const translate = opts.translate !== false;
  const client = translate ? (opts.textClient === undefined ? createAiClient('text') : opts.textClient) : null;
  const pauseMs = opts.pauseMs ?? 800;
  const emptyStreak = new Map<string, number>();

  for (const r of rows) {
    const host = hostOf(r.originalUrl);
    const before = (r.contentOriginal ?? '').length;
    if ((emptyStreak.get(host) ?? 0) >= HOST_SKIP_AFTER) {
      result.outcomes.push({ id: r.id, source: r.sourceName, before, after: before, result: 'skipped-host' });
      continue;
    }

    const page = await fetchPage(r.originalUrl);
    const body = page.content ? reflowParagraphs(page.content) : '';
    if (!body) emptyStreak.set(host, (emptyStreak.get(host) ?? 0) + 1);
    else emptyStreak.set(host, 0);

    if (!shouldReplaceBody(r.contentOriginal, body)) {
      result.outcomes.push({ id: r.id, source: r.sourceName, before, after: before, result: body ? 'unchanged' : 'unavailable' });
    } else {
      const outcome: RefetchOutcome = { id: r.id, source: r.sourceName, before, after: body.length, result: 'improved' };
      let contentKo: string | null = null;
      if (client && !api.billingBlocked) {
        const t = await translateLongText(body, { client, language: r.language, stats: api, chunkPauseMs: Math.min(pauseMs, 300) });
        if (t.ok) contentKo = t.text;
        outcome.translated = t.ok;
      }
      // The old translation covered only the teaser: replace it, or clear it so
      // the page shows the full original until the next translation run.
      await prisma.article.update({ where: { id: r.id }, data: { contentOriginal: body, contentKo } });
      result.outcomes.push(outcome);
      log(`[refetch] #${r.id} ${r.sourceName}: ${before} → ${body.length} chars${outcome.translated ? ' (translated)' : ''}`);
    }
    if (pauseMs > 0) await new Promise((res) => setTimeout(res, pauseMs));
  }
  return result;
}
