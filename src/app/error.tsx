'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/site';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [retrying, startTransition] = useTransition();

  useEffect(() => {
    console.error('[LiveNews Error]', error);
  }, [error]);

  // reset() alone only re-renders the client boundary; a server-component error needs a fresh
  // RSC payload, so refresh the route and reset the boundary in the same transition.
  const retry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center animate-fade-in">
      {/* Large error indicator */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-accent-red/5 blur-2xl scale-150" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-surface-card border border-accent-red/20 shadow-elevated">
          <svg aria-hidden="true" className="h-10 w-10 text-accent-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
      </div>

      <h1 className="mb-2 text-headline-lg text-text">
        문제가 발생했습니다
      </h1>
      <p className="mb-2 max-w-md text-body-md text-text-secondary">
        페이지를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
      </p>
      {error.digest && (
        <p className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-badge bg-surface-elevated text-caption text-text-muted border border-border-muted">
          <span className="text-text-secondary">오류 코드:</span> {error.digest}
        </p>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={retry}
          disabled={retrying}
          className="rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-accent/90 active:bg-accent/80 disabled:opacity-60"
        >
          다시 시도
        </button>
        {/* Full reload on purpose (drops broken client state); plain <a> needs the basePath */}
        <a
          href={withBasePath('/')}
          className="rounded-pill border border-border px-6 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:border-text-muted hover:text-text"
        >
          홈으로
        </a>
      </div>
    </div>
  );
}
