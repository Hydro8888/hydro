import prisma from '@/lib/db';
import { getCached } from '@/lib/redis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getCached('trending:all', 300, async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [keywordRows, articles] = await Promise.all([
        // Trending keywords: group by keyword in the last 24 h
        prisma.searchLog.groupBy({
          by: ['keyword'],
          where: { searchedAt: { gte: since } },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 20,
        }),

        // Trending articles: most viewed in last 24 h
        prisma.article.findMany({
          where: {
            isActive: true,
            publishedAt: { gte: since },
          },
          orderBy: { viewCount: 'desc' },
          take: 10,
          include: { source: true },
        }),
      ]);

      const keywords = keywordRows.map((r) => ({
        keyword: r.keyword,
        count: r._count.id,
      }));

      return { keywords, articles };
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error('[GET /api/trending]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
