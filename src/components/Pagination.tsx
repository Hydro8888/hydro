import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getPageItems, getPrevNext, normalizeTotalPages, type PageItem } from '@/lib/pagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /**
   * URL pattern with '[page]' placeholder.
   * Example: '/us?page=[page]' or '/category/economy?page=[page]'
   * Without the placeholder `?page=N` / `&page=N` is appended.
   */
  basePath: string;
}

function buildHref(pattern: string, page: number): string {
  if (pattern.includes('[page]')) {
    return pattern.replace('[page]', String(page));
  }
  // Fallback: append as query param
  const sep = pattern.includes('?') ? '&' : '?';
  return `${pattern}${sep}page=${page}`;
}

type Size = 'mobile' | 'desktop';

// Mobile: fixed 5 slots, narrow tabular buttons (worst case ≈256px, fits a 320px screen).
// Desktop (sm+): the previous 9-slot look.
const BTN_SIZE: Record<Size, string> = {
  mobile: 'h-10 min-w-9 px-1.5',
  desktop: 'h-10 min-w-[2.5rem] px-2',
};
const GAP_SIZE: Record<Size, string> = {
  mobile: 'h-10 w-5',
  desktop: 'h-10 min-w-[2.5rem]',
};
const ROW: Record<Size, string> = {
  mobile: 'flex sm:hidden flex-wrap items-center justify-center gap-1',
  desktop: 'hidden sm:flex flex-wrap items-center justify-center gap-1.5',
};

const BASE = 'inline-flex items-center justify-center rounded-card border text-body-md font-medium tabular-nums transition-colors';
const ACTIVE = 'bg-accent border-accent text-white';
const NORMAL = 'bg-surface-card border-border text-text-secondary hover:bg-surface-elevated hover:text-text';
const DISABLED = 'bg-surface border-border-muted text-text-muted cursor-not-allowed pointer-events-none';

function Chevron({ dir }: { dir: 'prev' | 'next' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'prev' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
    </svg>
  );
}

function PageRow({
  size,
  items,
  currentPage,
  prev,
  next,
  basePath,
}: {
  size: Size;
  items: PageItem[];
  currentPage: number;
  prev: number | null;
  next: number | null;
  basePath: string;
}) {
  const btn = (state: string) => cn(BASE, BTN_SIZE[size], state);
  return (
    <div className={ROW[size]}>
      {prev != null ? (
        <Link href={buildHref(basePath, prev)} aria-label="이전 페이지" className={btn(NORMAL)}>
          <Chevron dir="prev" />
        </Link>
      ) : (
        <span aria-disabled="true" className={btn(DISABLED)}>
          <Chevron dir="prev" />
        </span>
      )}

      {items.map((item, idx) =>
        item === 'gap' ? (
          <span
            key={`gap-${idx}`}
            aria-hidden="true"
            className={cn('inline-flex items-center justify-center text-body-md text-text-muted', GAP_SIZE[size])}
          >
            …
          </span>
        ) : item === currentPage ? (
          <span key={item} aria-current="page" aria-label={`${item} 페이지 (현재)`} className={btn(ACTIVE)}>
            {item}
          </span>
        ) : (
          <Link key={item} href={buildHref(basePath, item)} aria-label={`${item} 페이지`} className={btn(NORMAL)}>
            {item}
          </Link>
        ),
      )}

      {next != null ? (
        <Link href={buildHref(basePath, next)} aria-label="다음 페이지" className={btn(NORMAL)}>
          <Chevron dir="next" />
        </Link>
      ) : (
        <span aria-disabled="true" className={btn(DISABLED)}>
          <Chevron dir="next" />
        </span>
      )}
    </div>
  );
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  const total = normalizeTotalPages(totalPages);
  if (total <= 1) return null;

  // Every generated link stays within 1..total, even for NaN or out-of-range currentPage.
  const { prev, next } = getPrevNext(currentPage, total);
  const shared = { currentPage, prev, next, basePath };

  return (
    <nav aria-label="페이지 탐색" className="py-6">
      {/* Only one row is displayed (the other is display:none), so assistive tech reads it once. */}
      <PageRow size="mobile" items={getPageItems(currentPage, total, 0)} {...shared} />
      <PageRow size="desktop" items={getPageItems(currentPage, total, 2)} {...shared} />
    </nav>
  );
}
