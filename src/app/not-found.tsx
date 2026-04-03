import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center animate-fade-in">
      <p className="mb-4 text-[6rem] font-extrabold leading-none tracking-tighter text-surface-elevated select-none">
        404
      </p>
      <h1 className="mb-3 text-headline-lg text-text">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mb-8 max-w-md text-body-md text-text-secondary">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-accent/90 active:bg-accent/80"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        홈으로 돌아가기
      </Link>
    </div>
  );
}
