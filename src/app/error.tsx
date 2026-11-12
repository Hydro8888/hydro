'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from '@/lib/site';
import { BTN_PRIMARY, BTN_SECONDARY } from '@/lib/ui';

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

  // Same composition as the 404 screen: what happened, one primary action, one secondary.
  return (
    <div className="flex flex-col items-center px-4 py-24 text-center sm:py-32">
      <h1 className="text-headline-lg text-text">문제가 발생했습니다</h1>
      <p className="mt-3 max-w-md text-body-md text-text-secondary">
        페이지를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
      </p>
      {error.digest && (
        <p className="mt-2 text-caption text-text-muted">
          오류 코드 <span className="font-mono">{error.digest}</span>
        </p>
      )}
      <div className="mt-8 flex items-center gap-3">
        <button type="button" onClick={retry} disabled={retrying} className={BTN_PRIMARY}>
          다시 시도
        </button>
        {/* Full reload on purpose (drops broken client state); plain <a> needs the basePath */}
        <a href={withBasePath('/')} className={BTN_SECONDARY}>
          홈으로
        </a>
      </div>
    </div>
  );
}
