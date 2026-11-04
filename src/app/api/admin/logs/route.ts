import prisma from '@/lib/db';
import { parseIntParam, parsePage } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = parsePage(searchParams.get('page'));
    const limit = parseIntParam(searchParams.get('limit'), { min: 1, max: 100, fallback: 50 });
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [logs, total] = await Promise.all([
      prisma.collectionLog.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
        include: { source: { select: { id: true, sourceName: true, country: true } } },
      }),
      prisma.collectionLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[GET /api/admin/logs]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
