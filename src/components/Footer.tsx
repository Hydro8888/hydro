import Link from 'next/link';
import { MAIN_MENU } from '@/lib/constants';

const QUICK_LINKS = MAIN_MENU.filter(
  (m) => m.href !== '/' && m.href !== '/ranking',
).slice(0, 9);

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface-card border-t border-border mt-12 pb-16 lg:pb-0">
      <div className="mx-auto max-w-screen-xl px-4 py-10">
        {/* 2-column layout */}
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
          {/* Left: logo + description */}
          <div className="flex-1 max-w-sm">
            <div className="mb-3 flex items-center gap-0.5">
              <span className="text-lg font-extrabold text-accent">Live</span>
              <span className="text-lg font-extrabold text-text">News</span>
              <span className="ml-1.5 h-1 w-1 rounded-full bg-accent-red" />
            </div>
            <p className="text-body-md text-text-secondary leading-relaxed">
              전 세계 주요 뉴스를 AI 기반으로 번역 · 요약하여 한국어로 제공합니다.
              미국, 일본, 중국 등 글로벌 뉴스를 실시간으로 만나보세요.
            </p>
          </div>

          {/* Right: quick links */}
          <div>
            <h3 className="mb-3 text-overline text-text-muted uppercase tracking-widest">
              바로가기
            </h3>
            <ul className="grid grid-cols-3 gap-x-8 gap-y-2">
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

        {/* Divider */}
        <div className="my-6 border-t border-border-muted" />

        {/* AI disclaimer + Copyright */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <p className="text-xs leading-relaxed text-text-muted max-w-2xl">
            본 서비스의 기사는 AI를 통해 번역 · 요약되었으며, 원문 저작권은 각 언론사에 있습니다.
            번역 과정에서 오류가 발생할 수 있으므로, 중요한 정보는 원문을 직접 확인하시기 바랍니다.
          </p>
          <p className="text-xs text-text-muted whitespace-nowrap">
            &copy; {year} LiveNews
          </p>
        </div>
      </div>
    </footer>
  );
}
