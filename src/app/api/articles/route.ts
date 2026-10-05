import prisma from '@/lib/db';
import { getCached } from '@/lib/redis';
import { parseIntParam, parsePage } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const country = searchParams.get('country') ?? 'all';
    const category = searchParams.get('category');
    // Never NaN: garbage → defaults, out of range → clamped
    const page = parsePage(searchParams.get('page'));
    const limit = parseIntParam(searchParams.get('limit'), { min: 1, max: 100, fallback: 20 });
    const sort = searchParams.get('sort') === 'popular' ? 'popular' : 'latest';

    const cacheKey = `articles:${country}:${category ?? ''}:${page}:${limit}:${sort}`;

    const result = await getCached(cacheKey, 60, async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        isActive: true,
        ...(country !== 'all' && { country }),
        ...(category && { categoryPrimary: category }),
      };

      // Undated articles go last (PostgreSQL DESC puts NULL first); id breaks ties
      const orderBy = sort === 'popular'
        ? [{ viewCount: 'desc' as const }, { id: 'desc' as const }]
        : [{ publishedAt: { sort: 'desc' as const, nulls: 'last' as const } }, { id: 'desc' as const }];

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
