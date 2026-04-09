import prisma from '@/lib/db';
import { getCached } from '@/lib/redis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getCached('admin:stats', 60, async () => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [
        totalArticles,
        articlesToday,
        activeSources,
        articlesByCountry,
        articlesByCategory,
        recentLogs,
      ] = await Promise.all([
        prisma.article.count({ where: { isActive: true } }),

        prisma.article.count({
          where: { isActive: true, createdAt: { gte: startOfToday } },
        }),

        prisma.source.count({ where: { isEnabled: true } }),

        prisma.article.groupBy({
          by: ['country'],
          where: { isActive: true },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),

        prisma.article.groupBy({
          by: ['categoryPrimary'],
          where: { isActive: true, categoryPrimary: { not: null } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),

        prisma.collectionLog.findMany({
          orderBy: { startedAt: 'desc' },
          take: 20,
          include: { source: { select: { id: true, sourceName: true, country: true } } },
        }),
      ]);

      // Count sources that had a failed log in the last 24 h
      const failedSourceIds = await prisma.collectionLog.findMany({
        where: { status: 'failed', startedAt: { gte: since24h } },
        select: { sourceId: true },
        distinct: ['sourceId'],
      });

      return {
        totalArticles,
        articlesToday,
        activeSources,
        failedCollections: failedSourceIds.length,
        byCountry: articlesByCountry.map((r) => ({
          country: r.country,
          count: r._count.id,
        })),
        byCategory: articlesByCategory
          .filter((r) => r.categoryPrimary !== null)
          .map((r) => ({
            category: r.categoryPrimary as string,
            count: r._count.id,
          })),
        recentLogs,
      };
    });

    return NextResponse.json(stats);
  } catch (err) {
    console.error('[GET /api/admin/stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
