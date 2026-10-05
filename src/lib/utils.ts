import { CATEGORY_COLORS, IMAGE_PLACEHOLDER_SRC, MAX_PAGE, type CategoryStyle } from './constants';

// NOTE: shared by the browser, the Next server and the Node workers (src/workers/* import
// '../lib/utils'). Keep it free of DOM/Node-only APIs, and never format dates with the ICU
// locale APIs (output would depend on the server time zone and ICU build → hydration mismatches).

export type { CategoryStyle };

/** Own-property lookup, so slugs like 'constructor' or '__proto__' never hit Object.prototype. */
function hasOwn(obj: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

// ---------------------------------------------------------------------------
// Image validation — blocked URL patterns & domains
// ---------------------------------------------------------------------------

/** Blocked URL patterns indicating logos/placeholders, not real article images */
export const BLOCKED_IMAGE_PATTERNS: RegExp[] = [
  /logo/i,
  /brand/i,
  /favicon/i,
  /\bicon\b/i,
  /default[-_]?image/i,
  /placeholder/i,
  /share[-_]image/i,
  /site[-_]image/i,
  /og[-_]image/i,
  /sns[-_]image/i,
  /\/common\//i,
  /widget/i,
  /spacer/i,
  /pixel/i,
  /beacon/i,
  /tracking/i,
  /\b1x1\b/i,
  /\b50x50\b/i,
  /\b100x100\b/i,
  /\.svg(\?|$)/i,
  /^data:image\//i,
  /avatar/i,
  /banner[-_]?default/i,
  /transparent\./i,
  /blank\./i,
];

/** Domain-level patterns known to serve site-wide logos instead of article images */
export const BLOCKED_IMAGE_DOMAINS: RegExp[] = [
  /chinadaily\.com\.cn\/.*?(logo|masthead)/i,
  /chinadaily\.com\.cn\/image_e\//i,
  /cnbut\.png/i,
  /nhk\.or\.jp\/.*?common\//i,
  /reuters\.com\/pf\/resources\//i,
  /static\.bbc\.co\.uk\/.*?logo/i,
];

/** Domains known to serve site-wide logos instead of article images */
const BLOCKED_IMAGE_DOMAIN_NAMES = [
  'static.chinadaily.com.cn',
  'www.chinadaily.com.cn',
];

/** Check whether a URL looks like a real article image vs. site logo/placeholder */
export function isValidArticleImage(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length < 10) return false;

  // Check blocked patterns against full URL
  for (const pattern of BLOCKED_IMAGE_PATTERNS) {
    if (pattern.test(trimmed)) return false;
  }

  // Check domain-level blocked patterns
  for (const pattern of BLOCKED_IMAGE_DOMAINS) {
    if (pattern.test(trimmed)) return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false; // malformed or relative URL
  }

  // Only web images: javascript:, ftp:, file:, blob: … must never reach <img> or /api/img
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

  // Check blocked domain names
  const hostname = parsed.hostname;
  if (BLOCKED_IMAGE_DOMAIN_NAMES.some(d => hostname === d || hostname.endsWith('.' + d))) {
    return false;
  }

  return true;
}

/**
 * Normalizes an image URL: fixes protocol-relative URLs and upgrades http to https.
 * Returns null if the URL is not usable.
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  let trimmed = url.trim();
  if (!trimmed) return null;

  // Fix protocol-relative URLs: //example.com/img.jpg → https://example.com/img.jpg
  if (trimmed.startsWith('//')) {
    trimmed = 'https:' + trimmed;
  }

  // Upgrade http to https to avoid mixed content blocking
  if (trimmed.startsWith('http://')) {
    trimmed = trimmed.replace(/^http:\/\//, 'https://');
  }

  return trimmed;
}

/**
 * Wraps an external image URL through our image proxy to avoid
 * CORS, hotlink blocking, and mixed content issues.
 * Only proxies external URLs — data URIs and same-origin paths ('/x.png') pass through.
 * Protocol-relative URLs ('//cdn/x.jpg') are external: they are upgraded to https and proxied.
 */
export function proxyImageUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('//')) return `/livenews/api/img?url=${encodeURIComponent('https:' + url)}`;
  if (url.startsWith('data:') || url.startsWith('/')) return url;
  return `/livenews/api/img?url=${encodeURIComponent(url)}`;
}

// ---------------------------------------------------------------------------
// Category image seed keywords for default/fallback images
// ---------------------------------------------------------------------------

const CATEGORY_IMAGE_SEEDS: Record<string, string[]> = {
  economy: ['finance', 'stockmarket', 'trading', 'charts'],
  market: ['wallstreet', 'stocks', 'exchange', 'trading-floor'],
  politics: ['government', 'capitol', 'parliament', 'diplomacy'],
  sports: ['stadium', 'athletics', 'competition', 'match'],
  'ai-tech': ['technology', 'circuit', 'digital', 'computing'],
  semiconductor: ['microchip', 'silicon', 'wafer', 'processor'],
  automotive: ['automobile', 'factory', 'vehicle', 'highway'],
  energy: ['power', 'solar', 'wind-turbine', 'pipeline'],
  entertainment: ['performance', 'stage', 'cinema', 'entertainment'],
  health: ['medical', 'hospital', 'wellness', 'healthcare'],
  business: ['office', 'meeting', 'corporate', 'skyline'],
  science: ['laboratory', 'research', 'space', 'microscope'],
  society: ['cityscape', 'community', 'urban', 'people'],
  culture: ['museum', 'art', 'heritage', 'festival'],
  world: ['globe', 'international', 'landscape', 'travel'],
  general: ['newsroom', 'newspaper', 'press', 'editorial'],
};

// ---------------------------------------------------------------------------
// Dates — deterministic KST (UTC+9) formatting
// ---------------------------------------------------------------------------
// Korea has had no DST since 1988, so a fixed +9h offset is exact for every article date.
// Plain arithmetic on getUTC* values gives identical output on the server (TZ=UTC) and in
// the browser (TZ=Asia/Seoul), with no ICU differences ("오후" vs "PM").

export type DateInput = Date | string | number | null | undefined;

/** Calendar fields in KST. month 1-12, weekday 0 = Sunday. */
export interface KstParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
/** ECMAScript Date range (±100,000,000 days) */
const MAX_DATE_MS = 8.64e15;

/**
 * ISO-8601 date / date-time, 'T' or space separated, optional zone (Z, UTC, GMT, ±HH, ±HHMM, ±HH:MM).
 * Groups: year, month, day, hour, minute, second, fraction, zone.
 */
const ISO_DATE_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d+))?)?)?\s*(Z|UTC|GMT|[+-]\d{2}(?::?\d{2})?)?$/i;

function utcMs(year: number, month: number, day: number, hour: number, minute: number, second: number, ms: number): number {
  const d = new Date(0);
  // setUTCFullYear (unlike Date.UTC) does not remap years 0-99 to 1900-1999
  d.setUTCFullYear(year, month - 1, day);
  d.setUTCHours(hour, minute, second, ms);
  return d.getTime();
}

/** Strict ISO parse. A string WITHOUT a zone is read as UTC (Prisma stores UTC); V8 would use the local TZ. */
function parseDateString(raw: string): number {
  const s = raw.trim();
  if (!s) return NaN;
  const m = ISO_DATE_RE.exec(s);
  if (!m) return Date.parse(s); // other formats (RFC 2822 …) carry their own zone

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4] ?? 0);
  const minute = Number(m[5] ?? 0);
  const second = Number(m[6] ?? 0);
  const millis = Number(((m[7] ?? '') + '000').slice(0, 3));
  const endOfDay = hour === 24 && minute === 0 && second === 0 && millis === 0; // ISO '24:00'

  if (month < 1 || month > 12 || day < 1 || minute > 59 || second > 59 || (hour > 23 && !endOfDay)) return NaN;
  // Reject impossible days (2026-02-30) instead of rolling over like V8 does
  if (new Date(utcMs(year, month, day, 0, 0, 0, 0)).getUTCDate() !== day) return NaN;

  let offsetMin = 0;
  const zone = (m[8] ?? '').toUpperCase();
  if (zone && zone !== 'Z' && zone !== 'UTC' && zone !== 'GMT') {
    const digits = zone.slice(1).replace(':', '');
    const zh = Number(digits.slice(0, 2));
    const zm = Number(digits.slice(2) || 0);
    if (zh > 23 || zm > 59) return NaN;
    offsetMin = (zone[0] === '-' ? -1 : 1) * (zh * 60 + zm);
  }
  return utcMs(year, month, day, hour, minute, second, millis) - offsetMin * 60_000;
}

/** Epoch milliseconds, or null for null/undefined/''/unparseable/Invalid Date/out-of-range input. */
function toEpochMs(input: unknown): number | null {
  let ms: number;
  if (typeof input === 'number') ms = input;
  else if (typeof input === 'string') ms = parseDateString(input);
  else if (input instanceof Date) ms = input.getTime();
  else return null;
  return Number.isFinite(ms) && Math.abs(ms) <= MAX_DATE_MS ? ms : null;
}

const pad2 = (n: number): string => (n < 10 ? '0' : '') + n;
const pad4 = (n: number): string => (n < 0 ? '-' + String(-n).padStart(4, '0') : String(n).padStart(4, '0'));

/** KST calendar fields of an instant (weekday 0 = Sunday), or null for invalid input. */
export function toKstParts(input: DateInput): KstParts | null {
  const ms = toEpochMs(input);
  if (ms === null) return null;
  const d = new Date(ms + KST_OFFSET_MS);
  if (Number.isNaN(d.getTime())) return null;
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    weekday: d.getUTCDay(),
  };
}

/** 'YYYY.MM.DD HH:mm' in KST, 24-hour clock (e.g. '2026.10.01 17:03'). '' for invalid input. */
export function formatDate(input: DateInput): string {
  const p = toKstParts(input);
  if (!p) return '';
  return `${pad4(p.year)}.${pad2(p.month)}.${pad2(p.day)} ${pad2(p.hour)}:${pad2(p.minute)}`;
}

/** 'YYYY.MM.DD' in KST (e.g. '2026.10.01'). '' for invalid input. */
export function formatDateOnly(input: DateInput): string {
  const p = toKstParts(input);
  if (!p) return '';
  return `${pad4(p.year)}.${pad2(p.month)}.${pad2(p.day)}`;
}

/** ISO-8601 UTC string ('…Z') for <time dateTime>. undefined for invalid input (React then omits the attribute). */
export function toIsoDateTime(input: DateInput): string | undefined {
  const ms = toEpochMs(input);
  return ms === null ? undefined : new Date(ms).toISOString();
}

/**
 * Relative time in Korean: '방금 전' / 'N분 전' / 'N시간 전' / 'N일 전', then 'YYYY.MM.DD' (KST) after 7 days.
 * More than 60s in the future → absolute formatDate() (a ±60s clock skew still reads '방금 전').
 * Invalid input → ''.
 *
 * HYDRATION: the result depends on `now`, so server HTML and the first client render can differ.
 * In client components wrap it with suppressHydrationWarning on the DIRECT parent of the text:
 *   <time dateTime={toIsoDateTime(d)} suppressHydrationWarning>{timeAgo(d)}</time>
 */
export function timeAgo(input: DateInput, now?: Date | number): string {
  const t = toEpochMs(input);
  if (t === null) return '';
  const nowMs = toEpochMs(now) ?? Date.now();
  const diff = Math.floor((nowMs - t) / 1000);

  if (diff < -60) return formatDate(t);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

  return formatDateOnly(t);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function countryLabel(code: string): string {
  const map: Record<string, string> = {
    global: '세계', us: '미국', japan: '일본', china: '중국',
  };
  return map[code] || code;
}

export function countryColor(code: string): string {
  const map: Record<string, string> = {
    global: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    us: 'bg-red-500/15 text-red-400 border border-red-500/20',
    japan: 'bg-pink-500/15 text-pink-400 border border-pink-500/20',
    china: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  };
  return map[code] || 'bg-surface-elevated text-text-secondary';
}

export function categoryLabel(slug: string): string {
  const map: Record<string, string> = {
    politics: '정치', economy: '경제', market: '증시', business: '비즈니스',
    'ai-tech': 'AI·테크', semiconductor: '반도체', automotive: '자동차',
    energy: '에너지', society: '사회', culture: '문화', entertainment: '연예',
    sports: '스포츠', science: '과학', health: '건강', world: '세계',
    general: '일반', opinion: '오피니언', travel: '여행',
    // Country subcategory slugs (COUNTRY_SUBCATEGORIES) — without these the
    // category page title / breadcrumb shows the raw English slug
    'international-politics': '국제정치', 'war-diplomacy': '전쟁/외교',
    'global-economy': '글로벌 경제', climate: '기후/환경',
    'international-society': '국제사회', bigtech: '빅테크',
    industry: '산업', policy: '정책', technology: '기술',
    trade: '무역', international: '국제관계',
  };
  return map[slug] || slug;
}

export function buildSearchParams(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  });
  return sp.toString();
}

// ---------------------------------------------------------------------------
// Query-string integers (page, limit, …)
// ---------------------------------------------------------------------------

/**
 * Parses an integer query parameter without ever producing NaN.
 * - arrays (?page=2&page=3) → first element
 * - strings: trimmed, accepted only if ASCII digits (/^\d+$/); signs, decimals, exponents,
 *   full-width digits or trailing junk ('7abc') → fallback
 * - numbers: accepted only if Number.isInteger (NaN, Infinity, 2.5 → fallback)
 * - anything else → fallback
 * Accepted values are clamped to [min, max] ('0' → min, huge → max).
 */
export function parseIntParam(raw: unknown, opts: { min: number; max: number; fallback: number }): number {
  const { min, max, fallback } = opts;
  const value = Array.isArray(raw) ? raw[0] : raw;
  let n: number;
  if (typeof value === 'string') {
    const s = value.trim();
    if (!/^\d+$/.test(s)) return fallback;
    n = Number(s); // a very long digit string becomes Infinity → clamped to max below
  } else if (typeof value === 'number') {
    if (!Number.isInteger(value)) return fallback;
    n = value;
  } else {
    return fallback;
  }
  return Math.min(max, Math.max(min, n));
}

/**
 * Page number from `searchParams.page` (server: string | string[] | undefined) or
 * `URLSearchParams.get('page')` (client: string | null). Always an integer in 1..MAX_PAGE.
 */
export function parsePage(raw: unknown): number {
  return parseIntParam(raw, { min: 1, max: MAX_PAGE, fallback: 1 });
}

/**
 * Curated Unsplash photo IDs per category — permanent, high-quality editorial photos.
 * Each photo ID resolves to: https://images.unsplash.com/{id}?w=800&h=500&fit=crop
 * These are royalty-free photos from Unsplash's permanent CDN.
 */
export const CATEGORY_PHOTOS: Readonly<Record<string, readonly string[]>> = {
  economy:       ['photo-1611974789855-9c2a0a7236a3', 'photo-1590283603385-17ffb3a7f29f', 'photo-1526304640581-d334cdbbf45e', 'photo-1579532537598-459ecdaf39cc'],
  market:        ['photo-1611974789855-9c2a0a7236a3', 'photo-1640340434855-6084b1f4901c', 'photo-1642790106117-e829e14a795f', 'photo-1468254095679-bbcba94a7066'],
  politics:      ['photo-1529107386315-e1a2ed48a620', 'photo-1555848962-6e79363ec58f', 'photo-1541872703-74c5e44368f9', 'photo-1575320181282-9afab399332c'],
  sports:        ['photo-1471295253337-3ceaaedca402', 'photo-1579952363873-27f3bade9f55', 'photo-1517649763962-0c623066013b', 'photo-1574629810360-7efbbe195018'],
  'ai-tech':     ['photo-1677442136019-21780ecad995', 'photo-1620712943543-bcc4688e7485', 'photo-1555255707-c07966088b7b', 'photo-1518770660439-4636190af475'],
  semiconductor: ['photo-1518770660439-4636190af475', 'photo-1555255707-c07966088b7b', 'photo-1591799264318-7e6ef8ddb7ea', 'photo-1558494949-ef010cbdcc31'],
  automotive:    ['photo-1492144534655-ae79c964c9d7', 'photo-1503376780353-7e6692767b70', 'photo-1494976388531-d1058494cdd8', 'photo-1552519507-da3b142c6e3d'],
  energy:        ['photo-1466611653911-95081537e5b7', 'photo-1509391366360-2e959784a276', 'photo-1473341304170-971dccb5ac1e', 'photo-1532601224476-15c79f2f7a51'],
  entertainment: ['photo-1603190287605-e6ade32fa852', 'photo-1514533212735-5df27d970db0', 'photo-1470229722913-7c0e2dbbafd3', 'photo-1524368535928-5b5e00ddc76b'],
  health:        ['photo-1576091160399-112ba8d25d1d', 'photo-1559757148-5c350d0d3c56', 'photo-1530497610245-94d3c16cda28', 'photo-1505751172876-fa1923c5c528'],
  business:      ['photo-1486406146926-c627a92ad1ab', 'photo-1454165804606-c3d57bc86b40', 'photo-1507679799987-c73779587ccf', 'photo-1560179707-f14e90ef3623'],
  science:       ['photo-1507413245164-6160d8298b31', 'photo-1532094349884-543bc11b234d', 'photo-1451187580459-43490279c0fa', 'photo-1564325724739-bae0bd08762c'],
  society:       ['photo-1477959858617-67f85cf4f1df', 'photo-1480714378408-67cf0d13bc1b', 'photo-1519389950473-47ba0277781c', 'photo-1444723121867-7a241cacace9'],
  culture:       ['photo-1544967082-d9d25d867d66', 'photo-1518998053901-5348d3961a04', 'photo-1460661419201-fd4cecdf8a8b', 'photo-1513364776144-60967b0f800f'],
  world:         ['photo-1451187580459-43490279c0fa', 'photo-1526778548025-fa2f459cd5c1', 'photo-1488085061387-422e29b40080', 'photo-1504198322253-cfa87a0ff25f'],
  general:       ['photo-1504711331083-9c895941bf81', 'photo-1495020689067-958852a7765e', 'photo-1585829365295-ab7cd400c167', 'photo-1586339949216-35c2747cc36d'],
};

/**
 * Returns a real photograph URL from Unsplash CDN for articles without photos.
 * Uses curated, permanent photo IDs — no API key needed, always available.
 * Article ID determines which photo is shown (consistent per article).
 * Never returns a broken URL: unknown/blank category → 'general'; negative, fractional,
 * NaN or non-numeric ids → a valid slot (positive integer ids keep their historical photo).
 */
export function getDefaultImage(
  category: string | null | undefined,
  articleId: number | string | null | undefined,
): string {
  const cat = (category ?? '').trim().toLowerCase();
  const photos = hasOwn(CATEGORY_PHOTOS, cat) ? CATEGORY_PHOTOS[cat] : CATEGORY_PHOTOS.general;
  const n = typeof articleId === 'number' ? articleId : parseInt(String(articleId ?? ''), 10);
  const index = Number.isFinite(n) ? Math.abs(Math.trunc(n)) % photos.length : 0;
  return `https://images.unsplash.com/${photos[index]}?w=800&h=500&fit=crop&auto=format&q=75`;
}

/**
 * Ordered image candidates for an article — render sources[0], advance one step on error:
 *   [proxied original (only if it passes isValidArticleImage), Unsplash fallback, IMAGE_PLACEHOLDER_SRC]
 * The last entry is an inline SVG that cannot fail, so an error handler never loops.
 * Pure and deterministic (no Date/random) → identical on server and client (hydration-safe first src).
 */
export function getArticleImageSources(article: {
  id: number | string;
  imageUrl?: string | null;
  categoryPrimary?: string | null;
}): string[] {
  const sources: string[] = [];
  const original = normalizeImageUrl(article.imageUrl);
  if (original && isValidArticleImage(original)) sources.push(proxyImageUrl(original));
  sources.push(getDefaultImage(article.categoryPrimary, article.id));
  sources.push(IMAGE_PLACEHOLDER_SRC);
  return sources.filter((src, i) => sources.indexOf(src) === i);
}

// ---------------------------------------------------------------------------
// Design System helpers (Slice S1)
// ---------------------------------------------------------------------------

/**
 * Returns category color classes for the given slug.
 * Unknown slugs (e.g. country subcategories) get a neutral gray style.
 */
export function getCategoryStyle(slug: string): CategoryStyle {
  if (hasOwn(CATEGORY_COLORS, slug)) return CATEGORY_COLORS[slug];
  return { border: 'border-l-gray-500', text: 'text-text-secondary', bg: 'bg-surface-elevated', borderAll: 'border-gray-500' };
}

/** Merges class names, filtering out falsy values */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Estimates reading time in minutes based on character count.
 * Korean reading speed: ~500 characters per minute.
 * Returns at least 1.
 */
export function estimateReadingTime(content: string | null | undefined): number {
  if (!content) return 1;
  const charCount = content.replace(/\s/g, '').length;
  return Math.max(1, Math.round(charCount / 500));
}

// ---------------------------------------------------------------------------
// Display title & language tags
// ---------------------------------------------------------------------------

/**
 * Normalizes a stored language code into a value for the HTML `lang` attribute
 * ('ja' → 'ja', ' ZH ' → 'zh', 'zh-CN' → 'zh-cn'). Anything that is not a BCP-47-like
 * primary tag ('english', '', null) → undefined, so React omits the attribute.
 * globals.css relies on it: `:lang(ja)` / `:lang(zh)` turn off the Korean `word-break: keep-all`.
 */
export function toLangTag(language: string | null | undefined): string | undefined {
  if (typeof language !== 'string') return undefined;
  const tag = language.trim().toLowerCase();
  return /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/.test(tag) ? tag : undefined;
}

/**
 * The title to show for an article, with its language.
 * Korean title wins when it is a real translation: non-blank and not just an echo of the
 * original (an English titleKo identical to titleOriginal counts as untranslated).
 * Otherwise the original title is shown, tagged with the source language.
 *   const t = getDisplayTitle(article);  <h3 lang={t.lang}>{t.text}</h3>
 */
export function getDisplayTitle(a: {
  titleKo?: string | null;
  titleOriginal: string;
  language?: string | null;
}): { text: string; lang: string | undefined; isTranslated: boolean } {
  const ko = typeof a.titleKo === 'string' ? a.titleKo.trim() : '';
  const original = typeof a.titleOriginal === 'string' ? a.titleOriginal : '';
  const isTranslated = ko !== '' && ko !== original.trim();
  return isTranslated
    ? { text: ko, lang: 'ko', isTranslated: true }
    : { text: original, lang: toLangTag(a.language), isTranslated: false };
}
