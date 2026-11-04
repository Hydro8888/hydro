/**
 * image-cache.ts  (server only — uses fs)
 * Disk cache for optimized proxy images. Without it every page view re-fetched
 * every photo from the news site (a 5 MB CGTN PNG took ~5 s, on every request).
 *
 *  - dir: IMAGE_CACHE_DIR (default <project>/data/image-cache, gitignored,
 *    untouched by redeploy.sh)
 *  - entries expire after 14 days; the directory is pruned in the background
 *    (expired files first, then oldest until under IMAGE_CACHE_MAX_MB, default 1024)
 *  - concurrent requests for the same image share one fetch
 *  - failures are remembered for 10 minutes so a dead URL is not hammered
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

const TTL_MS = 14 * 24 * 60 * 60 * 1000;
const NEGATIVE_TTL_MS = 10 * 60 * 1000;
const PRUNE_INTERVAL_MS = 30 * 60 * 1000;
/** Bump to invalidate every cached variant after a change in processing. */
const CACHE_VERSION = 'v1';

const EXT_BY_TYPE: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};
const TYPE_BY_EXT: Record<string, string> = Object.fromEntries(Object.entries(EXT_BY_TYPE).map(([t, e]) => [e, t]));

export interface CachedImage {
  body: Buffer;
  contentType: string;
}

export function resolveImageCacheDir(env: Record<string, string | undefined> = process.env): string {
  const raw = env.IMAGE_CACHE_DIR?.trim();
  return raw ? path.resolve(raw) : path.join(process.cwd(), 'data', 'image-cache');
}

function maxCacheBytes(env: Record<string, string | undefined> = process.env): number {
  const mb = Number(env.IMAGE_CACHE_MAX_MB);
  return (Number.isFinite(mb) && mb > 0 ? mb : 1024) * 1024 * 1024;
}

export function imageCacheKey(url: string, width: number): string {
  return createHash('sha256').update(`${CACHE_VERSION}|${width}|${url}`).digest('hex');
}

export async function readCachedImage(key: string, dir = resolveImageCacheDir(), now = Date.now()): Promise<CachedImage | null> {
  for (const [ext, contentType] of Object.entries(TYPE_BY_EXT)) {
    const file = path.join(dir, `${key}.${ext}`);
    try {
      const st = await fs.stat(file);
      if (now - st.mtimeMs > TTL_MS) return null;
      return { body: await fs.readFile(file), contentType };
    } catch {
      // not this extension
    }
  }
  return null;
}

export async function writeCachedImage(key: string, image: CachedImage, dir = resolveImageCacheDir()): Promise<void> {
  const ext = EXT_BY_TYPE[image.contentType.toLowerCase()];
  if (!ext) return;
  await fs.mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.${key}.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmp, image.body);
  await fs.rename(tmp, path.join(dir, `${key}.${ext}`));
  schedulePrune(dir);
}

// ---------------------------------------------------------------------------
// Pruning
// ---------------------------------------------------------------------------

let lastPrune = 0;
let pruning = false;

function schedulePrune(dir: string): void {
  const now = Date.now();
  if (pruning || now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  pruning = true;
  pruneImageCache(dir)
    .catch((err) => console.warn('[image-cache] prune failed:', err instanceof Error ? err.message : err))
    .finally(() => {
      pruning = false;
    });
}

/** Deletes expired entries, then the oldest ones until the cache is under 90% of its limit. */
export async function pruneImageCache(
  dir = resolveImageCacheDir(),
  opts: { now?: number; maxBytes?: number } = {},
): Promise<{ removed: number; bytes: number }> {
  const now = opts.now ?? Date.now();
  const maxBytes = opts.maxBytes ?? maxCacheBytes();
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    return { removed: 0, bytes: 0 };
  }
  const files: Array<{ file: string; size: number; mtime: number }> = [];
  for (const name of names) {
    const file = path.join(dir, name);
    try {
      const st = await fs.stat(file);
      if (st.isFile()) files.push({ file, size: st.size, mtime: st.mtimeMs });
    } catch {
      /* raced with another prune */
    }
  }
  let removed = 0;
  let bytes = files.reduce((n, f) => n + f.size, 0);
  const remove = async (f: { file: string; size: number }) => {
    await fs.unlink(f.file).catch(() => undefined);
    removed++;
    bytes -= f.size;
  };
  const stale = (f: { file: string; mtime: number }) => now - f.mtime > TTL_MS || (f.file.endsWith('.tmp') && now - f.mtime > 60_000);
  for (const f of files.filter(stale)) await remove(f);
  const live = files.filter((f) => !stale(f)).sort((a, b) => a.mtime - b.mtime);
  for (const f of live) {
    if (bytes <= maxBytes * 0.9) break;
    await remove(f);
  }
  return { removed, bytes };
}

// ---------------------------------------------------------------------------
// In-flight sharing + negative cache
// ---------------------------------------------------------------------------

const inFlight = new Map<string, Promise<unknown>>();
const failures = new Map<string, { status: number; error: string; until: number }>();

/** Runs `produce` once per key at a time; concurrent callers get the same promise. */
export function shareInFlight<T>(key: string, produce: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = produce().finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

export function rememberFailure(key: string, status: number, error: string, now = Date.now()): void {
  if (failures.size > 5000) failures.clear();
  failures.set(key, { status, error, until: now + NEGATIVE_TTL_MS });
}

export function recentFailure(key: string, now = Date.now()): { status: number; error: string } | null {
  const f = failures.get(key);
  if (!f) return null;
  if (f.until < now) {
    failures.delete(key);
    return null;
  }
  return { status: f.status, error: f.error };
}
