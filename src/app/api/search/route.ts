import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = (searchParams.get('q') ?? '').trim();
    const country = searchParams.get('country') ?? 'all';
    const category = searchParams.get('category');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const sort = searchParams.get('sort') === 'popular' ? 'popular' : 'latest';

    if (!q) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    if (q.length > 500) {
      return NextResponse.json({ error: 'Search query too long' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isActive: true,
      OR: [
        { titleOriginal: { contains: q, mode: 'insensitive' } },
        { titleKo: { contains: q, mode: 'insensitive' } },
      ],
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

    // Log the search asynchronously — do not await
    prisma.searchLog.create({
      data: { keyword: q, resultCount: total },
    }).catch((err) => console.error('[GET /api/search] SearchLog write failed', err));

    return NextResponse.json({
      articles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      query: q,
    });
  } catch (err) {
    console.error('[GET /api/search]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
