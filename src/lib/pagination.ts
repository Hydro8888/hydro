// Pure page-range math for <Pagination> (slice S3). No React dependency; see tests/pagination.test.ts.

export type PageItem = number | 'gap';

function normTotal(total: number): number {
  return Number.isFinite(total) && Number.isInteger(total) && total >= 1 ? total : 1;
}

function normCurrent(current: number, total: number): number {
  const c = Number.isFinite(current) && Number.isInteger(current) ? current : 1;
  return Math.min(Math.max(c, 1), total);
}

/**
 * Fixed-slot page list: when total > 2*siblings + 5 the result has exactly 2*siblings + 5 items,
 * always contains 1, total and (clamped) current, numbers ascending, gaps never adjacent and
 * every gap hides at least 2 pages (a gap that would hide a single page shows that page instead).
 *   getPageItems(7, 14, 0) → [1, 'gap', 7, 'gap', 14]
 */
export function getPageItems(current: number, total: number, siblings: number): PageItem[] {
  const t = normTotal(total);
  const c = normCurrent(current, t);
  const s = Number.isFinite(siblings) && siblings > 0 ? Math.floor(siblings) : 0;
  const slots = 2 * s + 5;

  if (t <= slots) return Array.from({ length: t }, (_, i) => i + 1);

  // Run next to an edge when current is near it: [1..edgeRun, gap, total] or the mirror.
  // A middle window c-s..c+s needs ≥2 hidden pages on both sides: c-s ≥ 4 and c+s ≤ total-3.
  const edgeRun = slots - 2; // = 2s + 3
  if (c - s <= 3) {
    // Near the start: [1 .. edgeRun, gap, total]
    const items: PageItem[] = Array.from({ length: edgeRun }, (_, i) => i + 1);
    return [...items, 'gap', t];
  }
  if (c + s >= t - 2) {
    // Near the end: [1, gap, t-edgeRun+1 .. t]
    const items: PageItem[] = Array.from({ length: edgeRun }, (_, i) => t - edgeRun + 1 + i);
    return [1, 'gap', ...items];
  }
  // Middle: [1, gap, c-s .. c+s, gap, total]
  const mid: PageItem[] = Array.from({ length: 2 * s + 1 }, (_, i) => c - s + i);
  return [1, 'gap', ...mid, 'gap', t];
}

/** Prev/next targets; every non-null result is inside 1..total. */
export function getPrevNext(current: number, total: number): { prev: number | null; next: number | null } {
  const t = normTotal(total);
  if (!(Number.isFinite(current) && Number.isInteger(current))) return { prev: null, next: t > 1 ? 2 : null };
  return {
    prev: current > 1 ? Math.min(current - 1, t) : null,
    next: current < t ? Math.max(current + 1, 1) : null,
  };
}
