import { BTN_SECONDARY_SM, LOG_STATUS, NUM, PANEL, STATUS_DOT } from '@/lib/ui';
import { cn, formatCount } from '@/lib/utils';

// Pieces the admin screens share, so the same thing has the same size on every screen.
// No 'use client': these are imported by the (client) admin pages and hold no state.

/** A figure with its label and what it is counted over. Red only when `alert` (a failure count above zero). */
export function AdminStat({ label, value, basis, alert = false }: { label: string; value: number; basis: string; alert?: boolean }) {
  return (
    <div className={cn(PANEL, 'p-5')}>
      <dt className="text-caption text-text-secondary">{label}</dt>
      <dd className={cn('mt-2 text-headline-lg leading-none', NUM, alert ? 'text-negative' : 'text-text')}>{formatCount(value)}</dd>
      <dd className="mt-2 text-caption text-text-muted">{basis}</dd>
    </div>
  );
}

/** Collection log status: a Korean label, with the meaning color on the dot only. */
export function LogStatus({ log }: { log: { status: string } }) {
  const known = Object.prototype.hasOwnProperty.call(LOG_STATUS, log.status);
  const st = known ? LOG_STATUS[log.status] : { label: log.status, dot: 'bg-text-muted' };
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-text-secondary">
      <span aria-hidden="true" className={cn(STATUS_DOT, st.dot)} />
      {st.label}
    </span>
  );
}

/** On / off switch of a row (source enabled, article active). Off is not a failure, so it is never red. */
export function ActiveToggle({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={on} aria-label={label} className={BTN_SECONDARY_SM}>
      <span aria-hidden="true" className={cn(STATUS_DOT, on ? 'bg-positive' : 'bg-text-muted')} />
      {on ? '활성' : '비활성'}
    </button>
  );
}

/** Previous / next with the position as fixed-width figures: `1 / 14`. */
export function AdminPager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={BTN_SECONDARY_SM}>
        이전
      </button>
      <span className={cn('text-meta text-text-muted', NUM)}>
        {page} / {Math.max(1, totalPages)}
      </span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className={BTN_SECONDARY_SM}>
        다음
      </button>
    </div>
  );
}
