/**
 * generated-image-store.ts  (server only — uses fs)
 * AI-generated article images live on disk, not in the DB: OpenAI's image API
 * returns base64 data, not a URL. Files go to OPENAI_IMAGE_DIR (default
 * <project>/data/generated-images, gitignored and untouched by redeploy.sh's
 * `git reset --hard`) and are served by GET /api/generated-image/<file>.
 *
 * Relative imports only — the tsx worker runtime has no `@/` alias.
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { GENERATED_IMAGE_FILE_RE, GENERATED_IMAGE_PATH_PREFIX } from './utils';

export type GeneratedImageExt = 'jpg' | 'png' | 'webp';

const CONTENT_TYPES: Record<GeneratedImageExt, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/** 10 MB — larger than any 1536x1024 image the API returns; guards the disk. */
export const MAX_GENERATED_IMAGE_BYTES = 10 * 1024 * 1024;

export function resolveGeneratedImageDir(env: Record<string, string | undefined> = process.env): string {
  const raw = env.OPENAI_IMAGE_DIR?.trim();
  return raw ? path.resolve(raw) : path.join(process.cwd(), 'data', 'generated-images');
}

/** Deterministic, unguessable-enough name derived from the article (no user input in paths). */
export function generatedImageFileName(seed: string, ext: GeneratedImageExt): string {
  return `${createHash('sha256').update(seed).digest('hex').slice(0, 32)}.${ext}`;
}

export function contentTypeForGeneratedImage(file: string): string | null {
  const m = GENERATED_IMAGE_FILE_RE.exec(file);
  return m ? CONTENT_TYPES[m[1] as GeneratedImageExt] : null;
}

/**
 * Writes base64 image data and returns the public path to store in Article.imageUrl
 * (`/livenews/api/generated-image/<file>`), or null when the data is unusable.
 */
export async function saveGeneratedImage(
  seed: string,
  base64: string,
  ext: GeneratedImageExt,
  dir = resolveGeneratedImageDir(),
): Promise<string | null> {
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length < 100 || bytes.length > MAX_GENERATED_IMAGE_BYTES) return null;
  const file = generatedImageFileName(seed, ext);
  await fs.mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.${file}.${process.pid}.tmp`);
  await fs.writeFile(tmp, bytes);
  await fs.rename(tmp, path.join(dir, file));
  return `${GENERATED_IMAGE_PATH_PREFIX}${file}`;
}

/** Reads a stored image; null for invalid names or missing files (never reads outside `dir`). */
export async function readGeneratedImage(
  file: string,
  dir = resolveGeneratedImageDir(),
): Promise<{ body: Buffer; contentType: string } | null> {
  const contentType = contentTypeForGeneratedImage(file);
  if (!contentType) return null;
  try {
    const body = await fs.readFile(path.join(dir, file));
    return { body, contentType };
  } catch {
    return null;
  }
}
