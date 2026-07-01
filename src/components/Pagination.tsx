import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /**
   * URL pattern with '[page]' placeholder.
   * Example: '/us?page=[page]' or '/category/economy?page=[page]'
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

/**
 * Returns an array of page numbers (and ellipsis markers) to render.
 * Always shows first/last page and up to 2 pages either side of current.
 */
function getPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [];
  const addPage = (n: number) => {
    if (!pages.includes(n)) pages.push(n);
  };

  addPage(1);
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) {
    addPage(i);
  }
  if (current < total - 2) pages.push('...');
  addPage(total);

  return pages;
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageRange(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const baseBtn =
    'inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-card border px-2 text-body-md font-medium transition-colors';
  const activeBtn = `${baseBtn} bg-accent border-accent text-white`;
  const normalBtn = `${baseBtn} bg-surface-card border-border text-text-secondary hover:bg-surface-elevated hover:text-text`;
  const disabledBtn = `${baseBtn} bg-surface border-border-muted text-text-muted cursor-not-allowed pointer-events-none`;

  return (
    <nav
      aria-label="페이지 탐색"
      className="flex items-center justify-center gap-1.5 py-6"
    >
      {/* Previous */}
      {hasPrev ? (
        <Link
          href={buildHref(basePath, currentPage - 1)}
          aria-label="이전 페이지"
          className={normalBtn}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledBtn}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </span>
      )}

      {/* Page numbers */}
      {pages.map((page, idx) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="inline-flex h-10 min-w-[2.5rem] items-center justify-center text-body-md text-text-muted"
              aria-hidden="true"
            >
              ...
            </span>
          );
        }

        const isActive = page === currentPage;
        return isActive ? (
          <span
            key={page}
            aria-current="page"
            aria-label={`${page} 페이지 (현재)`}
            className={activeBtn}
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(basePath, page)}
            aria-label={`${page} 페이지`}
            className={normalBtn}
          >
            {page}
          </Link>
        );
      })}

      {/* Next */}
      {hasNext ? (
        <Link
          href={buildHref(basePath, currentPage + 1)}
          aria-label="다음 페이지"
          className={normalBtn}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledBtn}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </nav>
  );
}
