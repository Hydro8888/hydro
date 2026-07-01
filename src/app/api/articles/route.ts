import prisma from '@/lib/db';
import { getCached } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const country = searchParams.get('country') ?? 'all';
    const category = searchParams.get('category');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const sort = searchParams.get('sort') === 'popular' ? 'popular' : 'latest';

    const cacheKey = `articles:${country}:${category ?? ''}:${page}:${limit}:${sort}`;

    const result = await getCached(cacheKey, 60, async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        isActive: true,
        ...(country !== 'all' && { country }),
        ...(category && { categoryPrimary: category }),
      };

      const orderBy = sort === 'popular'
        ? { viewCount: 'desc' as const }
        : { publishedAt: 'desc' as const };

      const skip = (page - 1) * limit;

      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: { source: true },
        }),
        prisma.article.count({ where }),
      ]);

      return {
        articles,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/articles]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
