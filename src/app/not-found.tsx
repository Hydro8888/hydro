import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center animate-fade-in">
      {/* Large 404 text with accent glow */}
      <div className="relative mb-6 select-none">
        <p className="text-[7rem] sm:text-[9rem] font-extrabold leading-none tracking-tighter text-surface-elevated">
          4<span className="text-accent/30">0</span>4
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-accent/5 blur-2xl" />
        </div>
      </div>

      <h1 className="mb-3 text-headline-lg text-text">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mb-8 max-w-md text-body-md text-text-secondary">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        최신 뉴스는 홈 페이지에서 확인하실 수 있습니다.
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-accent/90 active:bg-accent/80"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          홈으로 돌아가기
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-pill border border-border px-6 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:border-text-muted hover:text-text"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          뉴스 검색
        </Link>
      </div>
    </div>
  );
}
