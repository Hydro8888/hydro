// Route parameter rules shared by pages and route handlers (slice S4).
// Pure — no React / Prisma / next imports — unit-tested in tests/routing.test.ts.
import { CATEGORIES, COUNTRIES, COUNTRY_SUBCATEGORIES } from './constants';
import { parsePage } from './utils';

const MAX_INT32 = 2_147_483_647;

/**
 * Article id from a path segment. Only plain ASCII digits (1–10 chars) in 1..2^31-1 are ids;
 * '0', '12abc', '-1', ' 1', '1.0', '' → null. Arrays use their first element.
 */
export function parseArticleId(raw: unknown): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 1 && value <= MAX_INT32 ? value : null;
  }
  if (typeof value !== 'string' || !/^\d{1,10}$/.test(value)) return null;
  const n = Number(value);
  return n >= 1 && n <= MAX_INT32 ? n : null;
}

/** Every slug /category/[slug] serves: the main categories plus all country sub-category pills. */
const KNOWN_CATEGORY_SLUGS: ReadonlySet<string> = new Set<string>([
  ...CATEGORIES.map((c) => c.slug),
  ...Object.values(COUNTRY_SUBCATEGORIES).flatMap((list) => list.map((s) => s.slug)),
]);

export function isKnownCategorySlug(slug: unknown): boolean {
  return typeof slug === 'string' && KNOWN_CATEGORY_SLUGS.has(slug);
}

/**
 * What a paginated list should do with the requested page once the total is known.
 * - page beyond the last page → redirect to the last page
 * - no data at all (totalPages 0) → only page 1 is valid
 */
export function resolvePageRequest(
  page: number,
  totalPages: number,
): { kind: 'ok' } | { kind: 'redirect'; page: number } {
  const last = Number.isFinite(totalPages) ? Math.max(0, Math.floor(totalPages)) : 0;
  if (last === 0) return page === 1 ? { kind: 'ok' } : { kind: 'redirect', page: 1 };
  if (page > last) return { kind: 'redirect', page: last };
  return { kind: 'ok' };
}

/** `path?page=n`, or bare `path` for page 1. */
export function pageHref(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path;
}

export type RankingCountry = (typeof COUNTRIES)[number]['code'];

/** `?country=` for /ranking: only known COUNTRIES codes, anything else (arrays → first element) → 'all'. */
export function normalizeRankingCountry(raw: unknown): RankingCountry {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const hit = COUNTRIES.find((c) => c.code === value);
  return hit ? hit.code : 'all';
}

// ---------------------------------------------------------------------------
// Query forwarding for segment layouts
// ---------------------------------------------------------------------------

/**
 * Request header the middleware fills with the URL query ('?page=3') for list routes that sit
 * under a loading.tsx boundary (/breaking, /category/*). Layouts do not receive searchParams,
 * but a redirect() thrown in the layout runs before the boundary streams → a real HTTP 307
 * instead of a streamed redirect (meta refresh + full reload after hydration).
 */
export const LIST_QUERY_HEADER = 'x-livenews-query';

/** Paths whose layouts read LIST_QUERY_HEADER. */
export function forwardsListQuery(pathname: string): boolean {
  return pathname === '/breaking' || pathname.startsWith('/category/');
}

/** `page` from a raw query string ('?page=3&x=1', 'page=abc', null) — same rules as parsePage. */
export function pageFromQuery(query: string | null | undefined): number {
  const params = new URLSearchParams(typeof query === 'string' ? query : '');
  return parsePage(params.get('page'));
}
