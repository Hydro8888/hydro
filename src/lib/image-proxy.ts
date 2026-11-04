/**
 * image-proxy.ts  (server only)
 * Shared handler of /api/img?url=… (legacy) and /api/img/w<width>.webp?url=….
 *
 *   disk cache hit → served immediately
 *   miss → (shared with concurrent requests) fetch through the SSRF-safe
 *          fetcher, trying a larger variant of known thumbnail URLs first and
 *          falling back to the original → resize to the requested width →
 *          WebP → store → serve
 *
 * The path form ends in ".webp" on purpose: Cloudflare caches by file
 * extension, so those responses are also cached at the edge.
 */

import { NextResponse } from 'next/server';
import { fetchImageSafely } from './safe-image-fetch';
import { upgradeImageUrlCandidates } from './image-url-upgrade';
import { normalizeImageWidth, optimizeImage } from './image-optimize';
import {
  imageCacheKey,
  readCachedImage,
  recentFailure,
  rememberFailure,
  shareInFlight,
  writeCachedImage,
  type CachedImage,
} from './image-cache';

/** Per larger-variant attempt (CGTN's 1280px variant sometimes takes 30 s). */
const UPGRADE_TIMEOUT_MS = 4000;

const ERROR_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
};

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: ERROR_HEADERS });
}

function ok(image: CachedImage, cache: 'HIT' | 'MISS') {
  return new NextResponse(new Uint8Array(image.body), {
    status: 200,
    headers: {
      'Content-Type': image.contentType,
      'Content-Length': String(image.body.length),
      // Same URL + width → same bytes for 14 days; browsers / Cloudflare may keep it a week.
      'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
      // An SVG opened directly must not run scripts
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'X-Image-Cache': cache,
    },
  });
}

type Produced = { ok: true; image: CachedImage } | { ok: false; status: number; error: string };

async function produce(url: string, width: number, key: string): Promise<Produced> {
  let fetched = null as Awaited<ReturnType<typeof fetchImageSafely>> | null;
  // Larger variants are a bonus: short timeout, then the original as usual.
  for (const larger of upgradeImageUrlCandidates(url, width)) {
    const r = await fetchImageSafely(larger, { timeoutMs: UPGRADE_TIMEOUT_MS });
    if (r.ok) {
      fetched = r;
      break;
    }
  }
  if (!fetched) fetched = await fetchImageSafely(url);
  if (!fetched.ok) {
    rememberFailure(key, fetched.status, fetched.error);
    return { ok: false, status: fetched.status, error: fetched.error };
  }
  const optimized = await optimizeImage(fetched.body, fetched.contentType, width);
  const image = { body: optimized.body, contentType: optimized.contentType };
  await writeCachedImage(key, image).catch((err) =>
    console.warn('[image-proxy] cache write failed:', err instanceof Error ? err.message : err),
  );
  return { ok: true, image };
}

/** Never throws; never answers 500 (400 / 403 / 413 / 415 / 502 / 504 with `{ error }`). */
export async function handleImageProxy(rawUrl: string | null, rawWidth: unknown): Promise<NextResponse> {
  try {
    if (!rawUrl) return fail(400, 'missing_url');
    const width = normalizeImageWidth(rawWidth);
    const key = imageCacheKey(rawUrl, width);

    const cached = await readCachedImage(key);
    if (cached) return ok(cached, 'HIT');

    const failed = recentFailure(key);
    if (failed) return fail(failed.status, failed.error);

    const result = await shareInFlight(key, () => produce(rawUrl, width, key));
    return result.ok ? ok(result.image, 'MISS') : fail(result.status, result.error);
  } catch (err) {
    console.error('[image-proxy] unexpected error:', err instanceof Error ? err.message : err);
    return fail(502, 'upstream_error');
  }
}
