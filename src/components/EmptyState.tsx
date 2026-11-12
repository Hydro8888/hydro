import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  detail?: string;
  /** Announce the two lines as an error (role="alert"). */
  alert?: boolean;
  /** At most one action. */
  children?: ReactNode;
}

// Empty and error states of a list: two lines and an optional action, nothing drawn.
// No 'use client' — imported by server and client pages alike.
export default function EmptyState({ title, detail, alert = false, children }: EmptyStateProps) {
  return (
    <div className="py-16 text-center">
      <div role={alert ? 'alert' : undefined}>
        <p className="text-headline-sm text-text">{title}</p>
        {detail ? <p className="mt-2 text-body-md text-text-secondary">{detail}</p> : null}
      </div>
      {children ? <div className="mt-6 flex justify-center">{children}</div> : null}
    </div>
  );
}
