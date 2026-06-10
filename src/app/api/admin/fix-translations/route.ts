import prisma from '@/lib/db';
import { invalidateCache } from '@/lib/redis';
import type { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * GET  /api/admin/fix-translations
 *   Dry-run: report how many articles are missing Korean translations.
 *
 * POST /api/admin/fix-translations?titles=500&content=30
 *   Re-translate missing titles/summaries (batched, cheap) and a
 *   cost-controlled batch of article bodies, then clear the cache.
 *   Run repeatedly until remainingTitles is 0.
 */

const MISSING_TITLE_WHERE: Prisma.ArticleWhereInput = {
  isActive: true,
  OR: [{ titleKo: null }, { titleKo: '' }],
};

const MISSING_SUMMARY_WHERE: Prisma.ArticleWhereInput = {
  isActive: true,
  OR: [{ summaryKo: null }, { summaryKo: '' }],
};

const MISSING_CONTENT_WHERE: Prisma.ArticleWhereInput = {
  isActive: true,
  AND: [
    { OR: [{ contentKo: null }, { contentKo: '' }] },
    { contentOriginal: { not: null } },
  ],
};

export async function GET() {
  try {
    const [total, missingTitles, missingSummaries, missingContent, samples] = await Promise.all([
      prisma.article.count({ where: { isActive: true } }),
      prisma.article.count({ where: MISSING_TITLE_WHERE }),
      prisma.article.count({ where: MISSING_SUMMARY_WHERE }),
      prisma.article.count({ where: MISSING_CONTENT_WHERE }),
      prisma.article.findMany({
        where: MISSING_TITLE_WHERE,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, titleOriginal: true, country: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      total,
      missingTitles,
      missingSummaries,
      missingContent,
      samples,
      message:
        `${missingTitles} of ${total} articles have no Korean title. ` +
        `POST ?titles=500&content=30 to heal (repeat until missingTitles is 0).`,
    });
  } catch (err) {
    console.error('[GET /api/admin/fix-translations]', err);
    return NextResponse.json({ error: 'Failed to check translations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const titles = Math.min(1000, Math.max(0, parseInt(searchParams.get('titles') ?? '300', 10) || 0));
    const content = Math.min(200, Math.max(0, parseInt(searchParams.get('content') ?? '30', 10) || 0));

    // Dynamic import keeps the worker out of unrelated route bundles
    const { backfillTranslations } = await import('@/workers/backfill');
    const stats = await backfillTranslations(prisma, {
      titleLimit: titles,
      contentLimit: content,
    });

    // Healed rows must be visible immediately — drop cached pages
    await invalidateCache('*').catch(() => null);

    return NextResponse.json({
      ...stats,
      message:
        `Healed ${stats.titlesFixed}/${stats.titlesScanned} titles and ` +
        `${stats.contentFixed}/${stats.contentScanned} bodies. ` +
        `Remaining: ${stats.remainingTitles} titles, ${stats.remainingContent} bodies.` +
        (stats.remainingTitles > 0 ? ' Run POST again to continue.' : ''),
    });
  } catch (err) {
    console.error('[POST /api/admin/fix-translations]', err);
    return NextResponse.json({ error: 'Failed to fix translations' }, { status: 500 });
  }
}
