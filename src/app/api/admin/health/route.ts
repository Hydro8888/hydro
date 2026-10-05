/**
 * GET /api/admin/health  (PUBLIC — used unauthenticated by redeploy.sh)
 * Health endpoint for monitoring pipeline status.
 * Returns: pipeline status, last collection time, circuit breaker state,
 * source count, article count, translation coverage counts.
 *
 * Public response ⇒ numbers and booleans only: no raw error strings (they can
 * contain feed URLs), no secrets.
 */

import prisma from '@/lib/db';
import { xaiTextBreaker, xaiImageBreaker } from '@/lib/circuit-breaker';
import { countTranslationBacklog, type TranslationBacklog } from '@/lib/translation-coverage';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Coverage counts scan the article table — cache them per process for 60s. */
const TRANSLATION_CACHE_MS = 60_000;
let translationCache: { at: number; value: TranslationBacklog } | null = null;

async function getTranslationCoverage(): Promise<TranslationBacklog | null> {
  if (translationCache && Date.now() - translationCache.at < TRANSLATION_CACHE_MS) {
    return translationCache.value;
  }
  try {
    const value = await countTranslationBacklog(prisma);
    translationCache = { at: Date.now(), value };
    return value;
  } catch (err) {
    // Coverage is informational: it must never turn the health check into a 503
    console.error('[GET /api/admin/health] translation coverage failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function GET() {
  const startMs = Date.now();

  try {
    // Check DB connectivity + gather counts in parallel
    const [sourceCount, articleCount, lastLog, recentLogs] = await Promise.all([
      prisma.source.count({ where: { isEnabled: true } }),
      prisma.article.count({ where: { isActive: true } }),
      prisma.collectionLog.findFirst({
        orderBy: { completedAt: 'desc' },
        select: { status: true, completedAt: true, articlesNew: true, articlesFound: true, errorMessage: true },
      }),
      prisma.collectionLog.findMany({
        orderBy: { completedAt: 'desc' },
        take: 5,
        select: { status: true, completedAt: true, articlesNew: true, articlesFound: true },
      }),
    ]);

    const dbOk = true;
    const latencyMs = Date.now() - startMs;
    const translation = await getTranslationCoverage();

    // Calculate next scheduled run (every 4 hours from last run)
    const lastTime = lastLog?.completedAt;
    const nextRunEstimate = lastTime
      ? new Date(lastTime.getTime() + 4 * 60 * 60 * 1000).toISOString()
      : null;

    // Time since last collection
    const hoursSinceLastRun = lastTime
      ? ((Date.now() - lastTime.getTime()) / (1000 * 60 * 60)).toFixed(1)
      : null;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      latencyMs,
      database: {
        connected: dbOk,
        sources: sourceCount,
        articles: articleCount,
      },
      pipeline: {
        lastCollectionTime: lastTime?.toISOString() ?? null,
        lastCollectionStatus: lastLog?.status ?? null,
        lastArticlesSaved: lastLog?.articlesNew ?? 0,
        lastArticlesFound: lastLog?.articlesFound ?? 0,
        // The message itself stays in the (authenticated) admin logs
        lastErrorPresent: Boolean(lastLog?.errorMessage),
        hoursSinceLastRun,
        nextRunEstimate,
        scheduleInterval: '4 hours',
        recentRuns: recentLogs.map(l => ({
          time: l.completedAt?.toISOString(),
          status: l.status,
          found: l.articlesFound,
          new: l.articlesNew,
        })),
      },
      translation,
      circuitBreakers: {
        xaiText: xaiTextBreaker.getState(),
        xaiImage: xaiImageBreaker.getState(),
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/health] database check failed:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startMs,
        error: 'database_unavailable',
        circuitBreakers: {
          xaiText: xaiTextBreaker.getState(),
          xaiImage: xaiImageBreaker.getState(),
        },
      },
      { status: 503 },
    );
  }
}
