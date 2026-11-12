import { NextRequest } from 'next/server';
import { handleImageProxy } from '@/lib/image-proxy';

export const dynamic = 'force-dynamic';

/**
 * Image proxy: /api/img?url=…[&w=640]
 * Kept for links already in pages / caches; new pages use /api/img/w<width>.webp?url=….
 * Resized + WebP + disk-cached (see src/lib/image-proxy.ts); SSRF-hardened
 * (src/lib/safe-image-fetch.ts). Errors: 400 / 403 / 413 / 415 / 502 / 504 — never 500.
 */
export async function GET(req: NextRequest) {
  // searchParams decodes once — no second decodeURIComponent (threw URIError → 500 on %25E0)
  return handleImageProxy(req.nextUrl.searchParams.get('url'), req.nextUrl.searchParams.get('w'));
}
