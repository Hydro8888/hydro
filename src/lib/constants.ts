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
  { slug: 'politics', label: '정치', icon: '🏛' },
  { slug: 'economy', label: '경제', icon: '📊' },
  { slug: 'market', label: '증시', icon: '📈' },
  { slug: 'business', label: '비즈니스', icon: '💼' },
  { slug: 'ai-tech', label: 'AI·테크', icon: '🤖' },
  { slug: 'semiconductor', label: '반도체', icon: '🔬' },
  { slug: 'automotive', label: '자동차', icon: '🚗' },
  { slug: 'energy', label: '에너지', icon: '⚡' },
  { slug: 'society', label: '사회', icon: '👥' },
  { slug: 'culture', label: '문화', icon: '🎭' },
  { slug: 'entertainment', label: '연예', icon: '🎬' },
  { slug: 'sports', label: '스포츠', icon: '⚽' },
  { slug: 'science', label: '과학', icon: '🔭' },
  { slug: 'health', label: '건강', icon: '❤' },
  { slug: 'world', label: '세계', icon: '🌍' },
  { slug: 'general', label: '일반', icon: '📰' },
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
// Design System tokens — Dark modern palette (Slice S1)
// ---------------------------------------------------------------------------

/**
 * Tailwind classes for one category.
 * - border:    2px left tick (`border-l-*`, used with `border-l-2`)
 * - borderAll: same color on all four sides (`border-*`, used with `border`)
 * - text / bg: label color and translucent tint
 */
export type CategoryStyle = { border: string; text: string; bg: string; borderAll: string };

/**
 * Category color map.
 * Tailwind generates only class names it finds as COMPLETE literals in the files listed under
 * `content` (tailwind.config.ts, which includes src/lib). Never build these names by string
 * concatenation or `.replace()` — the result would not exist in the CSS bundle.
 */
export const CATEGORY_COLORS: Record<string, CategoryStyle> = {
  politics:      { border: 'border-l-red-500',    text: 'text-red-400',    bg: 'bg-red-500/10', borderAll: 'border-red-500' },
  economy:       { border: 'border-l-blue-500',   text: 'text-blue-400',   bg: 'bg-blue-500/10', borderAll: 'border-blue-500' },
  market:        { border: 'border-l-indigo-500',  text: 'text-indigo-400',  bg: 'bg-indigo-500/10', borderAll: 'border-indigo-500' },
  business:      { border: 'border-l-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', borderAll: 'border-emerald-500' },
  'ai-tech':     { border: 'border-l-cyan-500',   text: 'text-cyan-400',   bg: 'bg-cyan-500/10', borderAll: 'border-cyan-500' },
  semiconductor: { border: 'border-l-violet-500',  text: 'text-violet-400',  bg: 'bg-violet-500/10', borderAll: 'border-violet-500' },
  automotive:    { border: 'border-l-sky-500',     text: 'text-sky-400',     bg: 'bg-sky-500/10', borderAll: 'border-sky-500' },
  energy:        { border: 'border-l-amber-500',   text: 'text-amber-400',   bg: 'bg-amber-500/10', borderAll: 'border-amber-500' },
  society:       { border: 'border-l-orange-500',  text: 'text-orange-400',  bg: 'bg-orange-500/10', borderAll: 'border-orange-500' },
  culture:       { border: 'border-l-rose-500',    text: 'text-rose-400',    bg: 'bg-rose-500/10', borderAll: 'border-rose-500' },
  entertainment: { border: 'border-l-pink-500',    text: 'text-pink-400',    bg: 'bg-pink-500/10', borderAll: 'border-pink-500' },
  sports:        { border: 'border-l-green-500',   text: 'text-green-400',   bg: 'bg-green-500/10', borderAll: 'border-green-500' },
  science:       { border: 'border-l-teal-500',    text: 'text-teal-400',    bg: 'bg-teal-500/10', borderAll: 'border-teal-500' },
  health:        { border: 'border-l-lime-500',    text: 'text-lime-400',    bg: 'bg-lime-500/10', borderAll: 'border-lime-500' },
  world:         { border: 'border-l-blue-400',    text: 'text-blue-300',    bg: 'bg-blue-400/10', borderAll: 'border-blue-400' },
  general:       { border: 'border-l-gray-500',    text: 'text-gray-400',    bg: 'bg-gray-500/10', borderAll: 'border-gray-500' },
};

/**
 * Last-resort article image: an inline SVG data URI, so it needs no network and can never fail.
 * 800x500 (16:10) like the Unsplash fallbacks; surface.elevated (#21262d) background with a
 * plain photo glyph in the border token (#30363d). No text, fonts or external references.
 * Intentionally rejected by isValidArticleImage (data: URI).
 */
const IMAGE_PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">' +
  '<rect width="800" height="500" fill="#21262d"/>' +
  '<g fill="none" stroke="#30363d" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="330" y="185" width="140" height="130" rx="12"/>' +
  '<path d="M348 297l36-42 28 30 22-22 30 34"/>' +
  '<circle cx="436" cy="222" r="12"/>' +
  '</g></svg>';

export const IMAGE_PLACEHOLDER_SRC: string =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(IMAGE_PLACEHOLDER_SVG);

/** Priority-based visual styles for breaking/urgent/normal news */
export const PRIORITY_STYLES = {
  breaking: { badge: 'bg-accent-red/15 text-accent-red border border-accent-red/30', dot: 'animate-pulse-dot bg-accent-red' },
  urgent:   { badge: 'bg-accent/15 text-accent border border-accent/30', dot: 'bg-accent' },
  normal:   { badge: 'bg-surface-elevated text-text-secondary', dot: 'bg-text-muted' },
} as const;

/** Badge style for AI-generated / AI-recommended content */
export const AI_BADGE_STYLE = 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20 text-overline' as const;
