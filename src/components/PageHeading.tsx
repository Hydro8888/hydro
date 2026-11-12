import type { ReactNode } from 'react';
import { NUM } from '@/lib/ui';
import { formatCount } from '@/lib/utils';

interface PageHeadingProps {
  title: string;
  /** Shown only when it is a number, so a list that has not loaded yet never reads "0건". */
  count?: number | null;
  unit?: string;
  /** Page-level controls (filters, the screen's actions). They wrap below the title on a narrow screen. */
  children?: ReactNode;
}

// The one title row of every list and admin screen: the page name, then its count as quiet
// fixed-width figures. No 'use client' — imported by server and client pages alike.
export default function PageHeading({ title, count, unit = '건', children }: PageHeadingProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-headline-lg text-text">{title}</h1>
        {typeof count === 'number' && (
          <p data-count className="text-meta text-text-muted">
            <span className={NUM}>{formatCount(count)}</span>
            {unit}
          </p>
        )}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}
