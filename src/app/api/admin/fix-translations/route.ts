import prisma from '@/lib/db';
import { invalidateCache } from '@/lib/redis';
import { parseIntParam } from '@/lib/utils';
import { countTranslationBacklog, selectBacklogIds } from '@/lib/translation-coverage';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * GET  /api/admin/fix-translations
 *   Dry-run: report how many articles are missing Korean translations
 *   (same definition as /api/admin/health and the backfill CLI — English
 *   echo titles and non-Korean summaries count as missing).
 *
 * POST /api/admin/fix-translations?titles=500&content=30
 *   Re-translate missing titles/summaries (batched, cheap) and a
 *   cost-controlled batch of article bodies, then clear the cache.
 *   Run repeatedly until remainingTitles is 0. (Truncated-body repair is
 *   CLI-only: npm run backfill:translations -- --content --repair-truncated)
 */

export async function GET() {
  try {
    const [total, backlog, sampleIds] = await Promise.all([
      prisma.article.count({ where: { isActive: true } }),
      countTranslationBacklog(prisma),
      selectBacklogIds(prisma, 'title', { take: 10 }),
    ]);
    const samples = sampleIds.length
      ? await prisma.article.findMany({
          where: { id: { in: sampleIds } },
          orderBy: { id: 'desc' },
          select: { id: true, titleOriginal: true, country: true, createdAt: true },
        })
      : [];

    return NextResponse.json({
      total,
      missingTitles: backlog.untranslatedTitles,
      missingSummaries: backlog.missingSummaries,
      missingContent: backlog.untranslatedBodies,
      truncatedBodies: backlog.truncatedBodies,
      samples,
      message:
        `${backlog.untranslatedTitles} of ${total} articles have no Korean title. ` +
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
    const titles = parseIntParam(searchParams.get('titles'), { min: 0, max: 1000, fallback: 300 });
    const content = parseIntParam(searchParams.get('content'), { min: 0, max: 200, fallback: 30 });

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
