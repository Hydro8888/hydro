import prisma from '@/lib/db';
import { getCached } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const country = searchParams.get('country') ?? 'all';

    const cacheKey = `categories:${country}`;

    const categories = await getCached(cacheKey, 120, async () => {
      const where: Parameters<typeof prisma.article.groupBy>[0]['where'] = {
        isActive: true,
        categoryPrimary: { not: null },
        ...(country !== 'all' && { country }),
      };

      const rows = await prisma.article.groupBy({
        by: ['categoryPrimary'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      return rows
        .filter((r) => r.categoryPrimary !== null)
        .map((r) => ({
          category: r.categoryPrimary as string,
          articleCount: r._count.id,
        }));
    });

    return NextResponse.json({ categories });
  } catch (err) {
    console.error('[GET /api/categories]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
