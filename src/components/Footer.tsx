import Link from 'next/link';

const QUICK_LINKS = [
  { href: '/breaking', label: '속보' },
  { href: '/world', label: '세계' },
  { href: '/us', label: '미국' },
  { href: '/japan', label: '일본' },
  { href: '/china', label: '중국' },
  { href: '/search', label: '검색' },
] as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface-card border-t border-border mt-12 pb-16 lg:pb-0">
      <div className="mx-auto max-w-screen-xl px-4 py-10">
        {/* 2-column layout */}
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
          {/* Left: logo + description */}
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-0.5">
              <span className="text-lg font-extrabold text-accent">Live</span>
              <span className="text-lg font-extrabold text-text">News</span>
            </div>
            <p className="text-body-md text-text-secondary max-w-sm leading-relaxed">
              전 세계 주요 뉴스를 AI 기반으로 번역 · 요약하여 한국어로 제공합니다.
            </p>
          </div>

          {/* Right: quick links */}
          <div>
            <h3 className="mb-3 text-overline text-text-muted uppercase tracking-widest">
              바로가기
            </h3>
            <ul className="grid grid-cols-3 gap-x-6 gap-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-md text-text-secondary hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI disclaimer */}
        <p className="mt-8 text-xs leading-relaxed text-text-muted max-w-2xl">
          본 서비스의 기사는 AI를 통해 번역 · 요약되었으며, 원문 저작권은 각 언론사에 있습니다.
          번역 과정에서 오류가 발생할 수 있으므로, 중요한 정보는 원문을 직접 확인하시기 바랍니다.
        </p>

        {/* Copyright */}
        <p className="mt-4 text-xs text-text-muted">
          &copy; {year} LiveNews. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
