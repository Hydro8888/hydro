import prisma from '@/lib/db';
import { invalidateCache } from '@/lib/redis';
import { parseArticleId } from '@/lib/routing';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

/** null id → 400 for a malformed id ('abc', '1.5'), 404 for an all-digit id out of range ('0', '99999999999'). */
function invalidIdResponse(raw: string) {
  return /^\d+$/.test(raw)
    ? NextResponse.json({ error: 'Article not found' }, { status: 404 })
    : NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const id = parseArticleId(params.id);
    if (id === null) return invalidIdResponse(params.id);

    // Inactive articles are not public
    const article = await prisma.article.findFirst({
      where: { id, isActive: true },
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

// Whitelisted updatable fields and their accepted types
const STRING_OR_NULL = ['titleKo', 'summaryKo', 'categoryPrimary', 'categorySecondary', 'imageUrl', 'author'] as const;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Builds the Prisma update from the body, or returns a 400 message for the first invalid field. */
function buildUpdate(body: Record<string, unknown>): { data: Record<string, unknown> } | { error: string } {
  const data: Record<string, unknown> = {};
  for (const key of STRING_OR_NULL) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v !== null && typeof v !== 'string') return { error: `${key} must be a string or null` };
    data[key] = v;
  }
  if ('tags' in body) {
    const v = body.tags;
    if (!Array.isArray(v) || !v.every((t) => typeof t === 'string')) return { error: 'tags must be an array of strings' };
    data.tags = v;
  }
  if ('clusterId' in body) {
    const v = body.clusterId;
    if (v !== null && !(typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 2_147_483_647)) {
      return { error: 'clusterId must be a positive integer or null' };
    }
    data.clusterId = v;
  }
  if ('isActive' in body) {
    if (typeof body.isActive !== 'boolean') return { error: 'isActive must be a boolean' };
    data.isActive = body.isActive;
  }
  return { data };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const id = parseArticleId(params.id);
    if (id === null) return invalidIdResponse(params.id);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (!isPlainObject(body)) {
      return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 });
    }

    const built = buildUpdate(body);
    if ('error' in built) {
      return NextResponse.json({ error: built.error }, { status: 400 });
    }
    if (Object.keys(built.data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await prisma.article.update({
      where: { id },
      data: built.data,
      include: { source: true },
    });

    // Public lists are cached for up to 2 minutes — drop them so a deactivation shows at once
    await invalidateCache('*').catch(() => null);

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
