import prisma from '@/lib/db';
import { getCached } from '@/lib/redis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sources = await getCached('sources:all', 300, async () => {
      const rows = await prisma.source.findMany({
        orderBy: { sourceName: 'asc' },
        include: {
          _count: { select: { articles: { where: { isActive: true } } } },
        },
      });

      return rows.map((s) => ({
        id: s.id,
        sourceName: s.sourceName,
        sourceType: s.sourceType,
        country: s.country,
        language: s.language,
        baseUrl: s.baseUrl,
        feedUrl: s.feedUrl,
        crawlInterval: s.crawlInterval,
        isEnabled: s.isEnabled,
        createdAt: s.createdAt,
        articleCount: s._count.articles,
      }));
    });

    return NextResponse.json({ sources });
  } catch (err) {
    console.error('[GET /api/sources]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
