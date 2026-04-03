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
    const [sourceCount, articleCount, lastLog] = await Promise.all([
      prisma.source.count({ where: { isEnabled: true } }),
      prisma.article.count({ where: { isActive: true } }),
      prisma.collectionLog.findFirst({
        orderBy: { completedAt: 'desc' },
        select: { status: true, completedAt: true, articlesNew: true },
      }),
    ]);

    const dbOk = true;
    const latencyMs = Date.now() - startMs;

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
        lastCollectionTime: lastLog?.completedAt?.toISOString() ?? null,
        lastCollectionStatus: lastLog?.status ?? null,
        lastArticlesSaved: lastLog?.articlesNew ?? 0,
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
