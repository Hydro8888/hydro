import prisma from '@/lib/db';
import { getCached } from '@/lib/redis';
import { startOfKstDay, type SiteStats } from '@/lib/site';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Public, minimal site stats for the header / footer chrome.
 * Exactly three integer keys — no logs, error messages or feed URLs (those stay in /api/admin/stats).
 * "Today" = since KST midnight, matching every other time shown on the site.
 */
export async function GET() {
  try {
    const stats = await getCached<SiteStats>('site:stats', 60, async () => {
      const [totalArticles, articlesToday, activeSources] = await Promise.all([
        prisma.article.count({ where: { isActive: true } }),
        prisma.article.count({ where: { isActive: true, createdAt: { gte: startOfKstDay(Date.now()) } } }),
        prisma.source.count({ where: { isEnabled: true } }),
      ]);
      return { totalArticles, articlesToday, activeSources };
    });
    const { totalArticles, articlesToday, activeSources } = stats;
    return NextResponse.json({ totalArticles, articlesToday, activeSources });
  } catch (err) {
    console.error('[api/stats]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
