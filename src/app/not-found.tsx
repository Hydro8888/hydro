import type { Metadata } from 'next';
import Link from 'next/link';
import { BTN_PRIMARY, BTN_SECONDARY, NUM } from '@/lib/ui';

// Rendered through the root title template → '페이지를 찾을 수 없습니다 | LiveNews'
export const metadata: Metadata = { title: '페이지를 찾을 수 없습니다' };

// Same composition as the error screen: what happened, one primary action, one secondary.
export default function NotFound() {
  return (
    <div className="flex flex-col items-center px-4 py-24 text-center sm:py-32">
      {/* Status code as a small fixed-width figure; the h1 already says it in words */}
      <p aria-hidden="true" className={`${NUM} text-meta text-text-muted`}>
        404
      </p>
      <h1 className="mt-3 text-headline-lg text-text">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 max-w-md text-body-md text-text-secondary">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        최신 뉴스는 홈 페이지에서 확인하실 수 있습니다.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className={BTN_PRIMARY}>
          홈으로
        </Link>
        <Link href="/search" className={BTN_SECONDARY}>
          뉴스 검색
        </Link>
      </div>
    </div>
  );
}
