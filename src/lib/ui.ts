// Shared control and table classes — one definition for every slice (UNSLOP-AUDIT §7-7, §7-15).
// Controls are 40px tall (32px compact) with the control radius. On the dark theme the primary
// button is a text-colored surface with an accent-ink label; the accent is never a button fill.
//
// Tailwind scans this file (src/lib is under `content`), so every class must appear here as a
// complete name. Composing whole constants, as `${CONTROL} …` does, is fine; never assemble a
// single class name from pieces.

const CONTROL =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control text-body-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

/** The one primary action of a screen. */
export const BTN_PRIMARY = `${CONTROL} h-10 px-4 bg-text text-accent-ink hover:bg-text/90`;
/** Secondary: raised surface with a hairline. */
export const BTN_SECONDARY = `${CONTROL} h-10 px-4 border border-border bg-surface-elevated text-text hover:border-text-muted`;
export const BTN_SECONDARY_SM = `${CONTROL} h-8 px-3 border border-border bg-surface-elevated text-text hover:border-text-muted`;
export const BTN_GHOST_SM = `${CONTROL} h-8 px-2 text-text-secondary hover:bg-surface-elevated hover:text-text`;

export const FIELD =
  'h-10 w-full rounded-control border border-border bg-surface-elevated px-3 text-body-md text-text placeholder:text-text-muted transition-colors';
export const FIELD_SM =
  'h-8 rounded-control border border-border bg-surface-elevated px-2 text-body-md text-text transition-colors';

export const CHIP =
  'inline-flex h-8 items-center whitespace-nowrap rounded-control border border-border px-3 text-body-md text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text';
/** Current position: a small surface step, a hairline and accent text (never an accent fill). */
export const CHIP_CURRENT =
  'inline-flex h-8 items-center whitespace-nowrap rounded-control border border-border bg-surface-elevated px-3 text-body-md text-accent';
export const TAG =
  'inline-flex h-6 items-center rounded-tag bg-surface-elevated px-2 text-caption text-text-secondary transition-colors hover:text-text';
/** Figures: fixed-width digits. Size and color come from the surrounding text. */
export const NUM = 'font-mono tabular-nums';

// Tables (admin)
export const PANEL = 'rounded-card border border-border bg-surface-card';
export const TABLE_WRAP = 'overflow-x-auto rounded-card border border-border bg-surface-card';
export const TH = 'h-10 px-4 text-left text-caption font-medium text-text-muted whitespace-nowrap';
export const TH_NUM = 'h-10 px-4 text-right text-caption font-medium text-text-muted whitespace-nowrap';
export const TR = 'transition-colors hover:bg-surface-elevated/50 focus-within:bg-surface-elevated/50';
export const TR_SELECTED = 'bg-surface-elevated';
export const TD = 'h-11 px-4 text-text-secondary';
export const TD_MAIN = 'h-11 px-4 text-text';
export const TD_NUM = 'h-11 px-4 text-right font-mono tabular-nums text-text';
export const TD_TIME = 'h-11 px-4 font-mono tabular-nums text-text-secondary whitespace-nowrap';
export const STATUS_DOT = 'h-2 w-2 shrink-0 rounded-full';
/** Collection log status. The meaning color goes on the dot only; `partial` is neither success nor failure, so it stays neutral. */
export const LOG_STATUS: Record<string, { label: string; dot: string }> = {
  success: { label: '성공', dot: 'bg-positive' },
  failed: { label: '실패', dot: 'bg-negative' },
  partial: { label: '부분', dot: 'bg-text-muted' },
};
