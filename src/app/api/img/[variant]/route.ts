import { NextRequest, NextResponse } from 'next/server';
import { handleImageProxy } from '@/lib/image-proxy';

export const dynamic = 'force-dynamic';

/**
 * Width-specific image proxy: /api/img/w640.webp?url=…
 * The ".webp" path lets Cloudflare cache the response at the edge (it caches by extension).
 */
export async function GET(req: NextRequest, { params }: { params: { variant: string } }) {
  const m = /^w(\d{2,5})\.webp$/.exec(params.variant);
  if (!m) {
    return NextResponse.json({ error: 'bad_variant' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  return handleImageProxy(req.nextUrl.searchParams.get('url'), Number(m[1]));
}
