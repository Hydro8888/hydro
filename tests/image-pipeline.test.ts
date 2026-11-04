/**
 * Unit tests for the image pipeline: larger-variant URLs, width handling,
 * srcset, WebP optimisation, disk cache. Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync, utimesSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import sharp from 'sharp';
import { upgradeImageUrl, upgradeImageUrlCandidates } from '../src/lib/image-url-upgrade';
import { normalizeImageWidth, optimizeImage } from '../src/lib/image-optimize';
import { imageCacheKey, pruneImageCache, readCachedImage, shareInFlight, writeCachedImage, rememberFailure, recentFailure } from '../src/lib/image-cache';
import { imageSrcSet, proxyImageUrl } from '../src/lib/utils';

test('thumbnail URLs are upgraded to larger variants (same host only)', () => {
  const cgtn = 'https://news.cgtn.com/news/2026-11-03/x/img/d01410317c5e463a91f9f1ce0cdf0f4e/d01410317c5e463a91f9f1ce0cdf0f4e-250.png';
  assert.equal(upgradeImageUrl(cgtn), cgtn.replace('-250.png', '-1280.png'));
  assert.equal(upgradeImageUrl(cgtn.replace('-250.png', '-1920.png')), null); // already large
  assert.equal(
    upgradeImageUrl('https://ichef.bbci.co.uk/news/240/cpsprodpb/1234/live/abc.jpg.webp'),
    'https://ichef.bbci.co.uk/news/1024/cpsprodpb/1234/live/abc.jpg.webp',
  );
  assert.equal(
    upgradeImageUrl('https://static01.nyt.com/images/2026/11/03/world/03x/03x-thumbStandard.jpg?quality=75'),
    'https://static01.nyt.com/images/2026/11/03/world/03x/03x-superJumbo.jpg',
  );
  assert.equal(upgradeImageUrl('https://japantoday.com/images/2026/11/photo-300x200.jpg'), 'https://japantoday.com/images/2026/11/photo.jpg');
  assert.equal(upgradeImageUrl('https://japantoday.com/images/photo-1200x800.jpg'), null); // already large
  assert.equal(upgradeImageUrl('https://a57.foxnews.com/static.foxnews.com/x/931/523/photo.jpg'), null);
  for (const bad of ['', 'not a url', 'javascript:alert(1)', 'data:image/png;base64,AA']) assert.equal(upgradeImageUrl(bad), null);
  const up = upgradeImageUrl(cgtn)!;
  assert.equal(new URL(up).hostname, new URL(cgtn).hostname);
});

test('CGTN candidates: closest sufficient size first, the other as backup', () => {
  const base = 'https://news.cgtn.com/news/x/img/52845941aec441db9c726cf6f7489895/52845941aec441db9c726cf6f7489895';
  assert.deepEqual(upgradeImageUrlCandidates(`${base}-250.png`, 640), [`${base}-750.png`, `${base}-1280.png`]);
  assert.deepEqual(upgradeImageUrlCandidates(`${base}-250.png`, 1280), [`${base}-1280.png`, `${base}-750.png`]);
  assert.deepEqual(upgradeImageUrlCandidates(`${base}-750.png`, 640), [`${base}-1280.png`]);
  assert.deepEqual(upgradeImageUrlCandidates('https://x.com/a.jpg', 640), []);
});

test('requested widths snap to the allowed set', () => {
  assert.equal(normalizeImageWidth(640), 640);
  assert.equal(normalizeImageWidth('500'), 640);
  assert.equal(normalizeImageWidth(1), 320);
  assert.equal(normalizeImageWidth(99999), 1600);
  for (const bad of [null, undefined, 'abc', '-5', 0, NaN, '1e3']) assert.equal(normalizeImageWidth(bad), 960);
});

test('proxy URLs and srcset', () => {
  const p = proxyImageUrl('https://x.com/a.jpg', 960);
  assert.equal(p, '/livenews/api/img/w960.webp?url=https%3A%2F%2Fx.com%2Fa.jpg');
  const set = imageSrcSet(p)!.split(', ');
  assert.equal(set.length, 6);
  assert.equal(set[0], '/livenews/api/img/w320.webp?url=https%3A%2F%2Fx.com%2Fa.jpg 320w');
  assert.equal(set[5], '/livenews/api/img/w1600.webp?url=https%3A%2F%2Fx.com%2Fa.jpg 1600w');
  assert.match(imageSrcSet('https://images.unsplash.com/photo-1?w=800&h=500&fit=crop')!, /w=480&h=500.* 480w, .*w=1200&h=500.* 1200w$/);
  assert.equal(imageSrcSet('/livenews/api/generated-image/0123456789abcdef0123456789abcdef.jpg'), undefined);
  assert.equal(imageSrcSet('data:image/svg+xml,…'), undefined);
  assert.equal(proxyImageUrl('/livenews/api/generated-image/a.jpg', 960), '/livenews/api/generated-image/a.jpg');
});

async function png(width: number, height: number): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: { r: 200, g: 60, b: 40 } } }).png().toBuffer();
}

test('a large PNG becomes a small WebP at the requested width (no enlargement)', async () => {
  const big = await png(1920, 1080);
  const out = await optimizeImage(big, 'image/png', 640);
  assert.equal(out.contentType, 'image/webp');
  assert.equal(out.width, 640);
  assert.equal(out.height, 360);
  assert.ok(out.body.length < big.length / 3, `${out.body.length} vs ${big.length}`);
  const small = await png(250, 140);
  const kept = await optimizeImage(small, 'image/png', 1280);
  assert.ok((kept.width ?? 0) <= 250); // never upscaled
  const gif = Buffer.from('GIF89a…');
  assert.deepEqual(await optimizeImage(gif, 'image/gif', 640), { body: gif, contentType: 'image/gif' });
  const junk = Buffer.from('not an image at all');
  assert.equal((await optimizeImage(junk, 'image/jpeg', 640)).body, junk); // falls back to original
});

test('disk cache: write/read, expiry, pruning by size, keys per width', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'img-cache-'));
  try {
    const k1 = imageCacheKey('https://x.com/a.jpg', 640);
    assert.notEqual(k1, imageCacheKey('https://x.com/a.jpg', 960));
    assert.equal(await readCachedImage(k1, dir), null);
    await writeCachedImage(k1, { body: Buffer.alloc(1000, 1), contentType: 'image/webp' }, dir);
    const hit = await readCachedImage(k1, dir);
    assert.equal(hit?.contentType, 'image/webp');
    assert.equal(hit?.body.length, 1000);
    assert.equal(await readCachedImage(k1, dir, Date.now() + 15 * 24 * 3600 * 1000), null); // expired after 14 days

    const k2 = imageCacheKey('https://x.com/b.jpg', 640);
    await writeCachedImage(k2, { body: Buffer.alloc(1000, 2), contentType: 'image/jpeg' }, dir);
    const old = new Date(Date.now() - 3600_000);
    utimesSync(path.join(dir, `${k1}.webp`), old, old);
    const r = await pruneImageCache(dir, { maxBytes: 1500 }); // over the limit → oldest goes
    assert.equal(r.removed, 1);
    assert.deepEqual(readdirSync(dir), [`${k2}.jpg`]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('concurrent requests share one fetch; failures are remembered briefly', async () => {
  let calls = 0;
  const work = () => new Promise<number>((r) => setTimeout(() => r(++calls), 20));
  const [a, b, c] = await Promise.all([shareInFlight('k', work), shareInFlight('k', work), shareInFlight('k', work)]);
  assert.deepEqual([a, b, c, calls], [1, 1, 1, 1]);
  rememberFailure('dead', 502, 'upstream_error', 1000);
  assert.deepEqual(recentFailure('dead', 2000), { status: 502, error: 'upstream_error' });
  assert.equal(recentFailure('dead', 1000 + 11 * 60_000), null);
});
