import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    const article = await prisma.article.findUnique({
      where: { id },
      include: { source: true },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Increment viewCount in the background — do not await to avoid slowing the response
    prisma.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch((err) => console.error('[GET /api/articles/[id]] viewCount increment failed', err));

    return NextResponse.json(article);
  } catch (err) {
    console.error('[GET /api/articles/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    const body = await req.json();

    // Whitelist updatable fields for safety
    const allowed = [
      'titleKo',
      'summaryKo',
      'categoryPrimary',
      'categorySecondary',
      'imageUrl',
      'author',
      'tags',
      'clusterId',
      'isActive',
    ] as const;

    type AllowedKey = (typeof allowed)[number];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    for (const key of allowed) {
      if (key in body) {
        data[key] = body[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await prisma.article.update({
      where: { id },
      data,
      include: { source: true },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    // Prisma record-not-found code
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    console.error('[PATCH /api/articles/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
