import { IMAGE_PLACEHOLDER_SRC } from './constants';

// Pure helpers for the article image fallback chain (slice S3). No React/DOM dependency,
// so they are unit-tested in tests/image-chain.test.ts and shared by ArticleImage / ArticleHeroImage.

/**
 * Next step in an image source list after a load error.
 * Advances one step and stops at the last entry (the inline SVG placeholder) — never loops.
 */
export function nextImageIndex(idx: number, length: number): number {
  if (!Number.isFinite(length) || length <= 0) return 0;
  const last = Math.floor(length) - 1;
  const i = Number.isFinite(idx) ? Math.max(0, Math.floor(idx)) : 0;
  return Math.min(i + 1, last);
}

/**
 * Normalizes image candidates into a chain that always ends in IMAGE_PLACEHOLDER_SRC.
 * - non-empty `sources` wins; otherwise the legacy pair [src, fallback] is used;
 * - blank / non-string values and duplicates are removed;
 * - the result has length ≥ 1 and its last entry is the placeholder (which cannot fail).
 */
export function resolveImageSources(p: {
  sources?: readonly (string | null | undefined)[] | null;
  src?: string | null;
  fallback?: string | null;
}): string[] {
  const clean = (list: readonly (string | null | undefined)[]) =>
    list.filter((s): s is string => typeof s === 'string' && s.trim() !== '');

  const fromSources = p.sources ? clean(p.sources) : [];
  const base = fromSources.length > 0 ? fromSources : clean([p.src, p.fallback]);

  const out: string[] = [];
  for (const s of base) if (!out.includes(s)) out.push(s);
  // Placeholder must be the terminal step: drop any earlier occurrence, then append once.
  const withoutPlaceholder = out.filter((s) => s !== IMAGE_PLACEHOLDER_SRC);
  withoutPlaceholder.push(IMAGE_PLACEHOLDER_SRC);
  return withoutPlaceholder;
}
