import Link from 'next/link';
import { NUM } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { getPageItems, getPrevNext, normalizeTotalPages, type PageItem } from '@/lib/pagination';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

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

// Mobile: fixed 5 slots with narrow fixed-width figures. Measured on a 320px screen (288px usable):
// 268px on page 1 of 5497, 283px on the last of 5497; only five-digit pages wrap to a second line.
// Desktop (sm+): 9 slots.
const BTN_SIZE: Record<Size, string> = {
  mobile: 'h-10 min-w-9 px-1',
  desktop: 'h-10 min-w-10 px-2',
};
const GAP_SIZE: Record<Size, string> = {
  mobile: 'h-10 w-5',
  desktop: 'h-10 min-w-10',
};
const ROW: Record<Size, string> = {
  mobile: 'flex sm:hidden flex-wrap items-center justify-center gap-1',
  desktop: 'hidden sm:flex flex-wrap items-center justify-center gap-1',
};

// Page numbers are identifiers (the same figure as ?page= in the URL), so they take no thousands separator.
const BASE = `inline-flex items-center justify-center rounded-control border text-body-md transition-colors ${NUM}`;
// Current page: one surface step, a hairline and accent figures — never an accent fill.
const ACTIVE = 'border-border bg-surface-elevated text-accent';
const NORMAL = 'border-transparent text-text-secondary hover:bg-surface-elevated hover:text-text';
const DISABLED = 'border-transparent text-text-muted opacity-50 pointer-events-none';

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
          <ChevronLeftIcon />
        </Link>
      ) : (
        <span aria-disabled="true" className={btn(DISABLED)}>
          <ChevronLeftIcon />
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
          <ChevronRightIcon />
        </Link>
      ) : (
        <span aria-disabled="true" className={btn(DISABLED)}>
          <ChevronRightIcon />
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
