import { NextResponse } from 'next/server';
import { readGeneratedImage } from '@/lib/generated-image-store';

export const dynamic = 'force-dynamic';

/**
 * GET /api/generated-image/<32 hex>.<jpg|png|webp>  (public)
 * Serves AI-generated article images saved by the collector. The file name is
 * validated against a strict pattern before touching the disk, so no path
 * traversal is possible. Images are immutable (name = content seed) → long cache.
 */
export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const image = await readGeneratedImage(params.file);
  if (!image) {
    return NextResponse.json({ error: 'not_found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  return new NextResponse(new Uint8Array(image.body), {
    status: 200,
    headers: {
      'Content-Type': image.contentType,
      'Content-Length': String(image.body.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
