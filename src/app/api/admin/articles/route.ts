import prisma from '@/lib/db';
import { COUNTRIES } from '@/lib/constants';
import { parseIntParam, parsePage } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Admin article list — includes inactive articles so they can be found and re-activated.
// Protected by the middleware (/api/admin/** always requires auth). Not cached: admin needs
// to see a toggle immediately.

const STATUS_WHERE = {
  all: {},
  active: { isActive: true },
  inactive: { isActive: false },
} as const;

type Status = keyof typeof STATUS_WHERE;

const COUNTRY_CODES = new Set<string>(COUNTRIES.map((c) => c.code).filter((c) => c !== 'all'));

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = parsePage(searchParams.get('page'));
    const limit = parseIntParam(searchParams.get('limit'), { min: 1, max: 100, fallback: 30 });
    const rawStatus = searchParams.get('status') ?? 'all';
    const status: Status = rawStatus === 'active' || rawStatus === 'inactive' ? rawStatus : 'all';
    const country = searchParams.get('country') ?? '';

    const where = {
      ...STATUS_WHERE[status],
      ...(COUNTRY_CODES.has(country) ? { country } : {}),
    };

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          titleKo: true,
          titleOriginal: true,
          language: true,
          country: true,
          categoryPrimary: true,
          publishedAt: true,
          isActive: true,
          viewCount: true,
          source: { select: { sourceName: true } },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({ articles, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /api/admin/articles]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
