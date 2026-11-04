/**
 * image-optimize.ts  (server only)
 * Resizes proxied article images to the width the page asked for and encodes
 * them as WebP. Originals were sent as-is: 1920×1080 PNGs of ~5 MB were
 * downloaded for 350 px cards.
 *
 * sharp is loaded lazily; if it is missing or fails, the original bytes are
 * returned unchanged (never an error page).
 */

import { DEFAULT_IMAGE_WIDTH, IMAGE_WIDTHS } from './utils';

export { DEFAULT_IMAGE_WIDTH, IMAGE_WIDTHS };
const WEBP_QUALITY = 78;
/** 40 MP — far above any news photo; protects memory on the shared server. */
const MAX_INPUT_PIXELS = 40_000_000;

/** The smallest allowed width ≥ the requested one (capped at the largest). */
export function normalizeImageWidth(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && /^\d{1,5}$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_IMAGE_WIDTH;
  return IMAGE_WIDTHS.find((w) => w >= n) ?? IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
}

type SharpFn = typeof import('sharp');
let sharpLoader: Promise<SharpFn | null> | null = null;

function loadSharp(): Promise<SharpFn | null> {
  if (!sharpLoader) {
    sharpLoader = import('sharp')
      .then((m) => {
        const sharp = ((m as unknown as { default?: SharpFn }).default ?? (m as unknown as SharpFn));
        sharp.cache({ memory: 64, files: 0, items: 50 });
        sharp.concurrency(2);
        return sharp;
      })
      .catch((err) => {
        console.warn('[image-optimize] sharp unavailable — serving original images:', err instanceof Error ? err.message : err);
        return null;
      });
  }
  return sharpLoader;
}

export interface OptimizedImage {
  body: Buffer;
  contentType: string;
  width?: number;
  height?: number;
}

/**
 * Resize to `width` (never enlarging) and encode as WebP. SVG and GIF (vector /
 * possibly animated) are passed through. When nothing was resized and the WebP
 * is not smaller, the original is kept.
 */
export async function optimizeImage(body: Buffer, contentType: string, width: number): Promise<OptimizedImage> {
  if (/svg|gif/i.test(contentType)) return { body, contentType };
  const sharp = await loadSharp();
  if (!sharp) return { body, contentType };
  try {
    const img = sharp(body, { failOn: 'none', limitInputPixels: MAX_INPUT_PIXELS });
    const meta = await img.metadata();
    const out = await img
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    const resized = (meta.width ?? 0) > width;
    if (!resized && out.data.length >= body.length) {
      return { body, contentType, width: meta.width, height: meta.height };
    }
    return { body: out.data, contentType: 'image/webp', width: out.info.width, height: out.info.height };
  } catch (err) {
    console.warn('[image-optimize] Could not process image — serving original:', err instanceof Error ? err.message : err);
    return { body, contentType };
  }
}
