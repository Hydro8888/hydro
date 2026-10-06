import { NextRequest, NextResponse } from 'next/server';
import { fetchImageSafely } from '@/lib/safe-image-fetch';

export const dynamic = 'force-dynamic';

const ERROR_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
};

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: ERROR_HEADERS });
}

/**
 * Image proxy endpoint: /api/img?url=...
 * Fetches external images through our server to avoid CORS, hotlink blocking,
 * and mixed content issues. Caches for 24 hours.
 *
 * SSRF-hardened (see src/lib/safe-image-fetch.ts): public http(s) hosts on
 * port 80/443 only, every redirect hop re-validated, image/* only, ≤ 10MB.
 * Errors: 400 / 403 / 413 / 415 / 502 / 504 with `{ error: <code> }` — never 500.
 */
export async function GET(req: NextRequest) {
  try {
    // `proxyImageUrl` encodes once and searchParams decodes once — no second
    // decodeURIComponent (it threw URIError → 500 on inputs like %25E0).
    const url = req.nextUrl.searchParams.get('url');
    if (!url) return fail(400, 'missing_url');

    const result = await fetchImageSafely(url);
    if (!result.ok) return fail(result.status, result.error);

    return new NextResponse(new Uint8Array(result.body), {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Content-Length': String(result.body.length),
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        // An SVG opened directly must not run scripts
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch (err) {
    console.error('[GET /api/img] unexpected error:', err instanceof Error ? err.message : err);
    return fail(502, 'upstream_error');
  }
}
