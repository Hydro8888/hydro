import prisma from '@/lib/db';
import { invalidateCache } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

// ─── GET ─────────────────────────────────────────────────────────────────────
// List all sources with their most recent collection log

export async function GET() {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { sourceName: 'asc' },
      include: {
        _count: { select: { articles: { where: { isActive: true } } } },
        collectionLogs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });

    const result = sources.map((s) => ({
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
      latestLog: s.collectionLogs[0] ?? null,
    }));

    return NextResponse.json({ sources: result });
  } catch (err) {
    console.error('[GET /api/admin/sources]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────
// Create a new source

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { sourceName, sourceType, country, language, baseUrl, feedUrl, crawlInterval, isEnabled } = body;

    if (!sourceName || !sourceType || !country || !language || !baseUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceName, sourceType, country, language, baseUrl' },
        { status: 400 }
      );
    }

    const source = await prisma.source.create({
      data: {
        sourceName: String(sourceName),
        sourceType: String(sourceType),
        country: String(country),
        language: String(language),
        baseUrl: String(baseUrl),
        feedUrl: feedUrl != null ? String(feedUrl) : null,
        crawlInterval: crawlInterval != null ? Number(crawlInterval) : 180,
        isEnabled: isEnabled != null ? Boolean(isEnabled) : true,
      },
    });

    // Bust sources caches
    await invalidateCache('sources:*').catch(() => null);

    return NextResponse.json(source, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/sources]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────────────
// Update an existing source (id must be provided in the request body)

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: 'Source id is required' }, { status: 400 });
    }

    const sourceId = parseInt(String(id), 10);
    if (isNaN(sourceId)) {
      return NextResponse.json({ error: 'Invalid source id' }, { status: 400 });
    }

    // Whitelist updatable fields
    const allowed = [
      'sourceName',
      'sourceType',
      'country',
      'language',
      'baseUrl',
      'feedUrl',
      'crawlInterval',
      'isEnabled',
    ] as const;

    type AllowedKey = (typeof allowed)[number];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (key in rest) {
        data[key] = rest[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await prisma.source.update({
      where: { id: sourceId },
      data,
    });

    // Bust sources caches
    await invalidateCache('sources:*').catch(() => null);
    await invalidateCache('admin:stats').catch(() => null);

    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }
    console.error('[PUT /api/admin/sources]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
