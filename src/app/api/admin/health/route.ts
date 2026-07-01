/**
 * GET /api/admin/health
 * Health endpoint for monitoring pipeline status.
 * Returns: pipeline status, last collection time, circuit breaker state,
 * source count, article count.
 */

import prisma from '@/lib/db';
import { xaiTextBreaker, xaiImageBreaker } from '@/lib/circuit-breaker';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
        lastError: lastLog?.errorMessage ?? null,
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
      circuitBreakers: {
        xaiText: xaiTextBreaker.getState(),
        xaiImage: xaiImageBreaker.getState(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - startMs,
        error: message,
        circuitBreakers: {
          xaiText: xaiTextBreaker.getState(),
          xaiImage: xaiImageBreaker.getState(),
        },
      },
      { status: 503 },
    );
  }
}
