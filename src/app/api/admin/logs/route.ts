import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
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
