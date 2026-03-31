/**
 * collector.ts
 * Main orchestrator for the news collection pipeline.
 *
 * Pipeline per source:
 *   1. Fetch enabled sources from DB
 *   2. Parse RSS feed
 *   3. Filter URLs already in DB
 *   4. Normalize raw items → Article shape
 *   5. Translate / categorize via AI
 *   6. Save new articles with prisma.article.createMany
 *   7. Write CollectionLog entry
 *   8. Invalidate Redis cache keys for affected country/category combos
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { parseRssFeed } from './rss-parser';
import { normalizeArticle } from './normalizer';
import { translateArticles } from './translator';
import { scrapeArticleContents } from './scraper';

// ---------------------------------------------------------------------------
// Clients — created once per process lifetime
// ---------------------------------------------------------------------------

const prisma = new PrismaClient();

function createRedis(): Redis {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  return new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
}

const redis = createRedis();

// ---------------------------------------------------------------------------
// Redis cache invalidation helpers
// (Mirrors the key patterns used by the Next.js API routes)
// ---------------------------------------------------------------------------

const CACHE_PATTERNS = [
  'articles:*',
  'feed:*',
  'breaking:*',
  'country:*',
  'category:*',
  'home:*',
];

async function invalidateCaches(): Promise<void> {
  try {
    for (const pattern of CACHE_PATTERNS) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[collector] Invalidated ${keys.length} Redis key(s) matching "${pattern}"`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[collector] Redis invalidation failed (non-fatal): ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Single-source collection
// ---------------------------------------------------------------------------

interface Source {
  id: number;
  sourceName: string;
  feedUrl: string | null;
  language: string;
  country: string;
}

interface CollectionResult {
  sourceId: number;
  articlesFound: number;
  articlesNew: number;
  status: 'success' | 'failed' | 'partial';
  errorMessage: string | null;
}

async function collectSource(source: Source): Promise<CollectionResult> {
  const startedAt = new Date();
  const logBase = `[collector] [${source.sourceName}]`;

  if (!source.feedUrl) {
    console.warn(`${logBase} No feedUrl configured — skipping`);
    return {
      sourceId: source.id,
      articlesFound: 0,
      articlesNew: 0,
      status: 'failed',
      errorMessage: 'No feedUrl configured',
    };
  }

  console.log(`${logBase} Starting collection from ${source.feedUrl}`);

  // ── Step 1: Parse RSS ────────────────────────────────────────────────────
  const rawItems = await parseRssFeed(source.feedUrl);
  if (rawItems.length === 0) {
    return {
      sourceId: source.id,
      articlesFound: 0,
      articlesNew: 0,
      status: 'partial',
      errorMessage: 'Feed returned no items',
    };
  }

  // ── Step 2: Filter already-known URLs ───────────────────────────────────
  const candidateUrls = rawItems.map((i) => i.link).filter(Boolean);

  let existingUrls: Set<string>;
  try {
    const existingRecords = await prisma.article.findMany({
      where: { originalUrl: { in: candidateUrls } },
      select: { originalUrl: true },
    });
    existingUrls = new Set(existingRecords.map((r) => r.originalUrl));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${logBase} DB lookup failed: ${message}`);
    return {
      sourceId: source.id,
      articlesFound: rawItems.length,
      articlesNew: 0,
      status: 'failed',
      errorMessage: `DB lookup failed: ${message}`,
    };
  }

  const newRawItems = rawItems.filter((i) => i.link && !existingUrls.has(i.link));
  console.log(
    `${logBase} ${rawItems.length} found, ${existingUrls.size} already exist, ${newRawItems.length} new`,
  );

  if (newRawItems.length === 0) {
    return {
      sourceId: source.id,
      articlesFound: rawItems.length,
      articlesNew: 0,
      status: 'success',
      errorMessage: null,
    };
  }

  // ── Step 3: Normalize ────────────────────────────────────────────────────
  const normalized = newRawItems
    .map((raw) => normalizeArticle(raw, source))
    .filter((a): a is NonNullable<typeof a> => a !== null);

  if (normalized.length === 0) {
    return {
      sourceId: source.id,
      articlesFound: rawItems.length,
      articlesNew: 0,
      status: 'partial',
      errorMessage: 'All new items failed normalization',
    };
  }

  // ── Step 3.5: Scrape full article content from original URLs ────────────
  try {
    await scrapeArticleContents(normalized);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`${logBase} Scraping failed (non-fatal): ${message}`);
  }

  // ── Step 4: Translate / Categorize ──────────────────────────────────────
  let enriched: typeof normalized;
  try {
    enriched = await translateArticles(normalized);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${logBase} Translation failed: ${message}`);
    // Fall back to un-translated articles so we don't lose the data
    enriched = normalized.map((a) => ({
      ...a,
      titleKo: '',
      summaryKo: '',
      categoryPrimary: 'general',
      categorySecondary: '',
    }));
  }

  // ── Step 5: Save to DB ───────────────────────────────────────────────────
  let savedCount = 0;
  let saveError: string | null = null;

  try {
    const result = await prisma.article.createMany({
      data: enriched.map((a) => ({
        sourceId: a.sourceId,
        originalUrl: a.originalUrl,
        titleOriginal: a.titleOriginal,
        titleKo: a.titleKo || null,
        summaryKo: a.summaryKo || null,
        contentOriginal: a.contentOriginal || null,
        contentKo: a.contentKo || null,
        publishedAt: a.publishedAt,
        language: a.language,
        country: a.country,
        author: a.author,
        imageUrl: a.imageUrl,
        categoryPrimary: a.categoryPrimary || 'general',
        categorySecondary: a.categorySecondary || null,
        tags: [],
        isActive: true,
      })),
      skipDuplicates: true,
    });
    savedCount = result.count;
    console.log(`${logBase} Saved ${savedCount} article(s)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${logBase} createMany failed: ${message}`);
    saveError = message;
  }

  const status: CollectionResult['status'] =
    saveError ? 'partial' : 'success';

  // ── Step 6: Write CollectionLog ──────────────────────────────────────────
  try {
    await prisma.collectionLog.create({
      data: {
        sourceId: source.id,
        status,
        articlesFound: rawItems.length,
        articlesNew: savedCount,
        errorMessage: saveError,
        startedAt,
        completedAt: new Date(),
      },
    });
  } catch (err) {
    // Log writing is non-fatal
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`${logBase} CollectionLog write failed (non-fatal): ${message}`);
  }

  return {
    sourceId: source.id,
    articlesFound: rawItems.length,
    articlesNew: savedCount,
    status,
    errorMessage: saveError,
  };
}

// ---------------------------------------------------------------------------
// collectAll — public entry point
// ---------------------------------------------------------------------------

export async function collectAll(): Promise<void> {
  const runStart = Date.now();
  console.log('[collector] ── Collection run started ──────────────────────');

  // ── Load enabled sources ─────────────────────────────────────────────────
  let sources: Source[];
  try {
    sources = await prisma.source.findMany({
      where: { isEnabled: true },
      select: {
        id: true,
        sourceName: true,
        feedUrl: true,
        language: true,
        country: true,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[collector] Failed to load sources: ${message}`);
    return;
  }

  if (sources.length === 0) {
    console.warn('[collector] No enabled sources found — nothing to collect');
    return;
  }

  console.log(`[collector] Processing ${sources.length} source(s)`);

  // ── Process sources sequentially to avoid API rate limits ────────────────
  const results: CollectionResult[] = [];
  for (const source of sources) {
    const result = await collectSource(source);
    results.push(result);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const totalFound = results.reduce((s, r) => s + r.articlesFound, 0);
  const totalNew   = results.reduce((s, r) => s + r.articlesNew,   0);
  const failed     = results.filter((r) => r.status === 'failed').length;
  const partial    = results.filter((r) => r.status === 'partial').length;
  const elapsed    = ((Date.now() - runStart) / 1000).toFixed(1);

  console.log(
    `[collector] ── Run complete in ${elapsed}s ─ ` +
    `sources: ${sources.length}, found: ${totalFound}, new: ${totalNew}, ` +
    `failed: ${failed}, partial: ${partial}`,
  );

  // ── Invalidate Redis caches if any new articles were saved ────────────────
  if (totalNew > 0) {
    await invalidateCaches();
  }
}

// ---------------------------------------------------------------------------
// Allow running directly: `tsx src/workers/collector.ts`
// ---------------------------------------------------------------------------

async function main() {
  try {
    await collectAll();
  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

// Run if this file is the entry point (works with both tsx and ts-node)
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('collector.ts') || process.argv[1].endsWith('collector.js'));

if (isMain) {
  main().catch((err) => {
    console.error('[collector] Fatal error:', err);
    process.exit(1);
  });
}
