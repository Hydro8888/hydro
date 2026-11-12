/**
 * excerpt.ts
 * Recognises article bodies that are only a teaser of the real article
 * (RSS descriptions such as "…Statewide,..." or "[…]"). Pure — shared by the
 * article page (to label them honestly) and the workers (to refetch them).
 */

/** Ends like a cut-off teaser: "...", "…", "[…]", "Read more", "Continue reading". */
const TEASER_END = new RegExp(
  '(\\.{3}|…|\\[\\s*(?:…|\\.{3})\\s*\\]|\\b(?:read more|continue reading|read the full (?:story|article))[^\\p{L}]*)\\s*$',
  'iu',
);

/** Bodies shorter than this are treated as summaries, not full articles. */
export const SHORT_BODY_CHARS = 600;

export function endsLikeTeaser(text: string | null | undefined): boolean {
  return typeof text === 'string' && TEASER_END.test(text.trim());
}

/**
 * The stored original is (very likely) only an excerpt of the article:
 * it ends like a teaser, or it is shorter than a news article can be.
 */
export function isExcerptBody(text: string | null | undefined): boolean {
  const t = (text ?? '').trim();
  if (!t) return false;
  return endsLikeTeaser(t) || Array.from(t).length < SHORT_BODY_CHARS;
}
