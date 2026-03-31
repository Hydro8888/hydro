/**
 * normalizer.ts
 * Transforms a raw RSS feed item into a shape that matches the Prisma Article model.
 */

import type { RawFeedItem } from './rss-parser';

/** Minimal source fields needed for normalization */
export interface SourceInfo {
  id: number;
  language: string;  // 'en' | 'ja' | 'zh' | 'ko'
  country: string;   // 'us' | 'japan' | 'china' | 'global'
}

/** Fields that map directly onto the Prisma Article model (minus AI-enriched ones) */
export interface NormalizedArticle {
  sourceId: number;
  originalUrl: string;
  titleOriginal: string;
  publishedAt: Date | null;
  language: string;
  country: string;
  author: string | null;
  imageUrl: string | null;
  // AI fields are filled later by the translator
  titleKo?: string;
  summaryKo?: string;
  categoryPrimary?: string;
  categorySecondary?: string;
}

// ---------------------------------------------------------------------------
// Image extraction helpers
// ---------------------------------------------------------------------------

/**
 * Attempts to pull an image URL from the raw content HTML.
 * Looks for <img src="..."> tags.
 */
function extractImageFromHtml(html: string): string | null {
  if (!html) return null;
  // Match the first <img … src="…"> or <img … src='…'>
  const match = html.match(/<img[^>]+src=['"]([^'"]+)['"]/i);
  return match?.[1] ?? null;
}

/**
 * Attempts to pull an image URL from Open Graph / meta tags embedded in content.
 * Some feeds embed og:image-style attributes in snippet text.
 */
function extractImageFromMeta(content: string): string | null {
  if (!content) return null;
  // <meta property="og:image" content="..." />
  const ogMatch = content.match(/og:image['"]\s+content=['"]([^'"]+)['"]/i);
  if (ogMatch?.[1]) return ogMatch[1];
  return null;
}

/**
 * Resolves the best available image URL for an article.
 * Priority: enclosure image → img in html content → meta og:image in content.
 */
function resolveImageUrl(
  raw: RawFeedItem,
): string | null {
  // 1. Enclosure (most reliable — explicitly declared as media)
  if (raw.enclosure?.url) {
    const { url, type } = raw.enclosure;
    // Only accept if it looks like an image
    const isImage =
      !type || type.startsWith('image/') || /\.(jpe?g|png|gif|webp|avif|svg)(\?.*)?$/i.test(url);
    if (isImage) return url;
  }

  // 2. First <img> inside the content HTML
  if (raw.content) {
    const fromHtml = extractImageFromHtml(raw.content);
    if (fromHtml) return fromHtml;

    const fromMeta = extractImageFromMeta(raw.content);
    if (fromMeta) return fromMeta;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Date parsing helper
// ---------------------------------------------------------------------------

function parseDate(raw: string | null): Date | null {
  if (!raw) return null;
  try {
    const d = new Date(raw);
    // Reject obviously invalid dates (e.g. year 1970 artifact from epoch 0)
    if (isNaN(d.getTime()) || d.getFullYear() < 2000) return null;
    return d;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Normalizes a single raw RSS item + source metadata into the shape expected
 * by the Prisma Article model.  Returns null if the item lacks a usable URL or title.
 */
export function normalizeArticle(
  raw: RawFeedItem,
  source: SourceInfo,
): NormalizedArticle | null {
  const originalUrl = raw.link?.trim();
  const titleOriginal = raw.title?.trim();

  if (!originalUrl || !titleOriginal) {
    return null;
  }

  return {
    sourceId: source.id,
    originalUrl,
    titleOriginal,
    publishedAt: parseDate(raw.pubDate),
    language: source.language,
    country: source.country,
    author: raw.creator?.trim() || null,
    imageUrl: resolveImageUrl(raw),
  };
}
