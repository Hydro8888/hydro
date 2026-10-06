import { toIsoDateTime, toKstParts, type DateInput } from './utils';

// Site-wide pure helpers (slice S2). No React / Prisma / DOM imports — shared by client
// components, route handlers and node:test unit tests.

/** Must equal `basePath` in next.config.js (asserted by tests/site.test.ts). */
export const BASE_PATH = '/livenews';

/**
 * Prefix a path with the basePath. Only for places Next does NOT prefix itself
 * (plain <a href>, fetch URLs). Never use with <Link>, router.push or redirect (double prefix).
 */
export function withBasePath(path: string): string {
  const p = path.replace(/^\/+/, '');
  return p ? `${BASE_PATH}/${p}` : BASE_PATH;
}

/** true only for the `/admin` segment itself and its children (`/admins`, `/administrator` → false). */
export function isAdminPath(pathname?: string | null): boolean {
  if (!pathname) return false;
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

// ---------------------------------------------------------------------------
// KST clock / year / day boundary (deterministic, independent of process TZ and ICU)
// ---------------------------------------------------------------------------

const WEEKDAYS_KO = '일월화수목금토';
const pad2 = (n: number): string => (n < 10 ? '0' : '') + n;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** '10월 6일 (화) 00:14:05' in KST plus the ISO-Z instant for <time dateTime>. null for invalid input. */
export function formatKstClock(input: DateInput): { label: string; dateTime: string } | null {
  const p = toKstParts(input);
  const dateTime = toIsoDateTime(input);
  if (!p || !dateTime) return null;
  return {
    label: `${p.month}월 ${p.day}일 (${WEEKDAYS_KO[p.weekday]}) ${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`,
    dateTime,
  };
}

/** Calendar year in KST (defaults to now). NaN-safe: falls back to the current instant. */
export function kstYear(input: DateInput = Date.now()): number {
  const p = toKstParts(input) ?? toKstParts(Date.now());
  return p ? p.year : new Date().getUTCFullYear();
}

/** KST midnight (00:00 KST = previous day 15:00 UTC) of the given instant. Throws RangeError for invalid input. */
export function startOfKstDay(input: DateInput): Date {
  const p = toKstParts(input);
  if (!p) throw new RangeError('startOfKstDay: invalid date');
  const d = new Date(0);
  d.setUTCFullYear(p.year, p.month - 1, p.day);
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() - KST_OFFSET_MS);
}

// ---------------------------------------------------------------------------
// Public site stats (GET /api/stats)
// ---------------------------------------------------------------------------

export const SITE_STATS_PATH = '/api/stats';

export type SiteStats = { totalArticles: number; articlesToday: number; activeSources: number };

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/** Validates the public stats payload; returns only the three known fields, or null. */
export function parseSiteStats(json: unknown): SiteStats | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  if (!isCount(o.totalArticles) || !isCount(o.articlesToday) || !isCount(o.activeSources)) return null;
  return { totalArticles: o.totalArticles, articlesToday: o.articlesToday, activeSources: o.activeSources };
}
