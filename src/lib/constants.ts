export const COUNTRIES = [
  { code: 'all', label: '전체', labelEn: 'All' },
  { code: 'global', label: '세계', labelEn: 'World' },
  { code: 'us', label: '미국', labelEn: 'US' },
  { code: 'japan', label: '일본', labelEn: 'Japan' },
  { code: 'china', label: '중국', labelEn: 'China' },
] as const;

export const COUNTRY_SUBCATEGORIES: Record<string, Array<{ slug: string; label: string }>> = {
  global: [
    { slug: 'international-politics', label: '국제정치' },
    { slug: 'war-diplomacy', label: '전쟁/외교' },
    { slug: 'global-economy', label: '글로벌 경제' },
    { slug: 'climate', label: '기후/환경' },
    { slug: 'international-society', label: '국제사회' },
  ],
  us: [
    { slug: 'politics', label: '정치' },
    { slug: 'business', label: '비즈니스' },
    { slug: 'market', label: '증시' },
    { slug: 'bigtech', label: '빅테크' },
    { slug: 'society', label: '사회' },
    { slug: 'sports', label: '스포츠' },
  ],
  japan: [
    { slug: 'politics', label: '정치' },
    { slug: 'economy', label: '경제' },
    { slug: 'industry', label: '산업' },
    { slug: 'semiconductor', label: '반도체' },
    { slug: 'automotive', label: '자동차' },
    { slug: 'society', label: '사회' },
    { slug: 'entertainment', label: '엔터' },
  ],
  china: [
    { slug: 'policy', label: '정책' },
    { slug: 'economy', label: '경제' },
    { slug: 'industry', label: '산업' },
    { slug: 'technology', label: '기술' },
    { slug: 'trade', label: '무역' },
    { slug: 'society', label: '사회' },
    { slug: 'international', label: '국제관계' },
  ],
};

export const CATEGORIES = [
  { slug: 'politics', label: '정치' },
  { slug: 'economy', label: '경제' },
  { slug: 'market', label: '증시' },
  { slug: 'business', label: '비즈니스' },
  { slug: 'ai-tech', label: 'AI·테크' },
  { slug: 'semiconductor', label: '반도체' },
  { slug: 'automotive', label: '자동차' },
  { slug: 'energy', label: '에너지' },
  { slug: 'society', label: '사회' },
  { slug: 'culture', label: '문화' },
  { slug: 'entertainment', label: '연예' },
  { slug: 'sports', label: '스포츠' },
  { slug: 'science', label: '과학' },
  { slug: 'health', label: '건강' },
  { slug: 'world', label: '세계' },
  { slug: 'general', label: '일반' },
] as const;

export const MAIN_MENU = [
  { href: '/', label: '홈' },
  { href: '/breaking', label: '속보' },
  { href: '/world', label: '세계' },
  { href: '/us', label: '미국' },
  { href: '/japan', label: '일본' },
  { href: '/china', label: '중국' },
  { href: '/category/economy', label: '경제' },
  { href: '/category/market', label: '증시' },
  { href: '/category/ai-tech', label: 'AI·테크' },
  { href: '/category/semiconductor', label: '반도체' },
  { href: '/category/sports', label: '스포츠' },
  { href: '/search', label: '검색' },
  { href: '/ranking', label: '랭킹' },
] as const;

export const ITEMS_PER_PAGE = 20;

/** Items per page on /breaking (queries.ts still hardcodes 30 — S4 swaps it for this). */
export const BREAKING_ITEMS_PER_PAGE = 30;

/**
 * Upper bound for any `?page=` value (see parsePage in utils.ts).
 * 20x+ the largest real listing (breaking ≈ 458 pages); max skip ≈ 300k stays inside Prisma's Int range.
 */
export const MAX_PAGE = 10_000;

// ---------------------------------------------------------------------------
// Category label style — neutral (Slice S1)
// ---------------------------------------------------------------------------

/**
 * Tailwind classes for a category label.
 * - text:      label color. Categories are plain text labels: apply this alone.
 * - bg:        neutral surface, only where a label needs one (e.g. over a photo)
 * - border:    hairline on the left (`border-l-*`, used with `border-l-2`)
 * - borderAll: hairline on all four sides (`border-*`, used with `border`)
 */
export type CategoryStyle = { border: string; text: string; bg: string; borderAll: string };

/**
 * The one category style. Complete class literals: Tailwind generates only names it finds
 * verbatim in the files under `content` (tailwind.config.ts, which includes src/lib). Never
 * build these names by string concatenation or `.replace()`.
 */
const NEUTRAL_CATEGORY_STYLE: CategoryStyle = Object.freeze({
  border: 'border-l-border',
  text: 'text-text-secondary',
  bg: 'bg-surface-elevated',
  borderAll: 'border-border',
});

/** slug → style for the 16 categories. Categories are not color-coded: every value is the same neutral style. */
export const CATEGORY_COLORS: Record<string, CategoryStyle> = Object.freeze(
  Object.fromEntries(CATEGORIES.map((c) => [c.slug, NEUTRAL_CATEGORY_STYLE])),
);

/**
 * Last-resort article image: an inline SVG data URI, so it needs no network and can never fail.
 * 800x500 (16:10) like the Unsplash fallbacks; surface.elevated (#262421) background with a
 * plain photo glyph drawn like the hairline (text color #efe9de at 10%). No text, fonts or
 * external references.
 * Intentionally rejected by isValidArticleImage (data: URI).
 */
const IMAGE_PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">' +
  '<rect width="800" height="500" fill="#262421"/>' +
  '<g fill="none" stroke="#efe9de" stroke-opacity="0.1" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="330" y="185" width="140" height="130" rx="12"/>' +
  '<path d="M348 297l36-42 28 30 22-22 30 34"/>' +
  '<circle cx="436" cy="222" r="12"/>' +
  '</g></svg>';

export const IMAGE_PLACEHOLDER_SRC: string =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(IMAGE_PLACEHOLDER_SVG);
