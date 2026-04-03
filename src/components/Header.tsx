'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MAIN_MENU, COUNTRIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import SearchBar from './SearchBar';

/* ------------------------------------------------------------------ */
/*  Live clock (updates every second)                                  */
/* ------------------------------------------------------------------ */
function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      return now.toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    };
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;
  return (
    <time className="hidden md:flex items-center gap-1.5 text-caption text-text-muted tabular-nums select-none">
      <span className="inline-block h-1 w-1 rounded-full bg-accent-green animate-pulse-dot" />
      {time}
    </time>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop nav items (exclude search, ranking from main strip)        */
/* ------------------------------------------------------------------ */
const NAV_ITEMS = MAIN_MENU.filter(
  (m) => m.href !== '/search' && m.href !== '/ranking',
);

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */
export default function Header() {
  const pathname = usePathname();
  const scrollDir = useScrollDirection(20);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef<HTMLLIElement>(null);
  const navScrollRef = useRef<HTMLUListElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setCountryOpen(false);
  }, [pathname]);

  // Close country picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-scroll active nav item into view
  useEffect(() => {
    if (!navScrollRef.current) return;
    const active = navScrollRef.current.querySelector('[data-active="true"]');
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [pathname]);

  const isActive = useCallback((href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }, [pathname]);

  const collapsed = scrollDir === 'down' && !mobileOpen && !searchOpen;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full bg-surface/95 backdrop-blur-md border-b border-border transition-transform duration-300',
          collapsed && '-translate-y-[var(--nav-h)]',
        )}
        style={{ '--nav-h': '40px' } as React.CSSProperties}
      >
        {/* -- Tier 1: Logo + clock + search toggle ------------------- */}
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="flex h-12 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-0.5 select-none group">
              <span className="text-xl font-extrabold tracking-tight text-accent transition-colors group-hover:text-accent/80">
                LiveNews
              </span>
              <span className="text-lg font-medium tracking-tight text-text-secondary">.co.kr</span>
              <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-accent-red animate-pulse-dot" />
            </Link>

            {/* Scrolling slogan */}
            <div className="hidden sm:block ml-3 flex-1 max-w-[200px] overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-surface to-transparent z-10" />
              <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-surface to-transparent z-10" />
              <p className="whitespace-nowrap text-caption font-medium text-accent/70 animate-[slogan_8s_linear_infinite]">
                전세계 뉴스를 한눈에 &nbsp;&nbsp;&nbsp; 전세계 뉴스를 한눈에 &nbsp;&nbsp;&nbsp;
              </p>
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-2">
              <LiveClock />

              {/* Search toggle (desktop) */}
              <button
                aria-label="검색"
                onClick={() => setSearchOpen((v) => !v)}
                className={cn(
                  'hidden sm:flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-caption transition-all duration-200',
                  searchOpen
                    ? 'border-accent text-accent bg-accent/5'
                    : 'border-border text-text-secondary hover:border-text-muted hover:text-text',
                )}
              >
                <SearchIcon className="h-3.5 w-3.5" />
                <span>검색</span>
                <kbd className="hidden lg:inline-block ml-1 px-1.5 py-0.5 text-[10px] rounded bg-surface-elevated text-text-muted border border-border-muted">
                  /
                </kbd>
              </button>

              {/* Search toggle (mobile) */}
              <button
                aria-label="검색"
                onClick={() => setSearchOpen((v) => !v)}
                className="sm:hidden p-2 rounded-md text-text-secondary hover:text-accent hover:bg-surface-elevated transition-colors"
              >
                <SearchIcon className="h-5 w-5" />
              </button>

              {/* Hamburger (mobile/tablet) */}
              <button
                aria-label="메뉴"
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden p-2 rounded-md text-text-secondary hover:text-accent hover:bg-surface-elevated transition-colors"
              >
                <div className="relative w-5 h-5 flex flex-col items-center justify-center">
                  <span className={cn(
                    'block h-0.5 w-4 bg-current rounded transition-all duration-300 absolute',
                    mobileOpen ? 'rotate-45 top-[9px]' : 'top-[5px]',
                  )} />
                  <span className={cn(
                    'block h-0.5 w-4 bg-current rounded transition-all duration-300 absolute top-[9px]',
                    mobileOpen ? 'opacity-0 scale-x-0' : 'opacity-100',
                  )} />
                  <span className={cn(
                    'block h-0.5 w-4 bg-current rounded transition-all duration-300 absolute',
                    mobileOpen ? '-rotate-45 top-[9px]' : 'top-[13px]',
                  )} />
                </div>
              </button>
            </div>
          </div>

          {/* Expandable search bar */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-in-out',
              searchOpen ? 'max-h-20 pb-3 opacity-100' : 'max-h-0 opacity-0',
            )}
          >
            <SearchBar placeholder="뉴스 검색..." />
          </div>
        </div>

        {/* -- Tier 2: Nav bar (desktop) -------------------------------- */}
        <nav
          className="hidden lg:block bg-surface-card/60 border-t border-border-muted"
          style={{ height: 'var(--nav-h, 40px)' }}
        >
          <div className="mx-auto max-w-screen-xl px-4">
            <ul
              ref={navScrollRef}
              className="flex items-center h-10 gap-0 overflow-x-auto scrollbar-none"
            >
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      data-active={active}
                      className={cn(
                        'nav-link relative inline-flex items-center whitespace-nowrap',
                        active && 'nav-link-active',
                      )}
                    >
                      {item.label}
                    </Link>
                    {/* Hacker News right after 스포츠 */}
                    {item.href === '/category/sports' && (
                      <a
                        href="https://hacker.ai.kr"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-link inline-flex items-center gap-1 whitespace-nowrap text-accent-green font-semibold hover:text-accent-green/80 transition-colors ml-1"
                      >
                        Hacker News
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </li>
                );
              })}

              {/* Ranking link at end with separator */}
              <li className="ml-auto flex items-center gap-2">
                <span className="h-4 w-px bg-border-muted" />
                <Link
                  href="/ranking"
                  className={cn(
                    'nav-link relative inline-flex items-center whitespace-nowrap gap-1',
                    isActive('/ranking') && 'nav-link-active',
                  )}
                >
                  <ChartIcon className="h-3.5 w-3.5" />
                  랭킹
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* -- Mobile slide-down menu ----------------------------------- */}
        <div
          className={cn(
            'lg:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-border-muted bg-surface-card',
            mobileOpen ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0 border-t-0',
          )}
        >
          <nav className="mx-auto max-w-screen-xl px-4 py-3">
            <p className="text-overline text-text-muted uppercase tracking-widest mb-2 px-1">
              카테고리
            </p>
            <ul className="grid grid-cols-3 sm:grid-cols-4 gap-1">
              {MAIN_MENU.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center justify-center rounded-card px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:bg-surface-elevated hover:text-text',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Hacker News link in mobile */}
            <a
              href="https://hacker.ai.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-card px-3 py-2.5 mt-2 text-sm font-semibold text-accent-green bg-accent-green/10 hover:bg-accent-green/20 transition-colors"
            >
              Hacker News
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {/* Country section in mobile menu */}
            <p className="text-overline text-text-muted uppercase tracking-widest mt-4 mb-2 px-1">
              국가별
            </p>
            <ul className="flex gap-2 px-1 pb-1">
              {COUNTRIES.filter((c) => c.code !== 'all').map((country) => {
                const href = country.code === 'global' ? '/world' : `/${country.code}`;
                return (
                  <li key={country.code}>
                    <Link
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors',
                        isActive(href)
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-text-secondary hover:border-text-muted hover:text-text',
                      )}
                    >
                      {country.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      {/* -- Mobile bottom nav (sticky) -------------------------------- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-t border-border safe-area-bottom">
        <nav className="mx-auto max-w-md">
          <ul className="flex items-center justify-around h-14">
            {/* Home */}
            <li>
              <Link
                href="/"
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors',
                  isActive('/') && pathname === '/' ? 'text-accent' : 'text-text-secondary hover:text-text',
                )}
              >
                <HomeIcon />
                <span>홈</span>
              </Link>
            </li>

            {/* Breaking */}
            <li>
              <Link
                href="/breaking"
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors',
                  isActive('/breaking') ? 'text-accent' : 'text-text-secondary hover:text-text',
                )}
              >
                <BoltIcon />
                <span>속보</span>
              </Link>
            </li>

            {/* Search */}
            <li>
              <Link
                href="/search"
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors',
                  isActive('/search') ? 'text-accent' : 'text-text-secondary hover:text-text',
                )}
              >
                <SearchIcon className="h-5 w-5" />
                <span>검색</span>
              </Link>
            </li>

            {/* Country picker */}
            <li ref={countryRef} className="relative">
              <button
                onClick={() => setCountryOpen((v) => !v)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors',
                  countryOpen ? 'text-accent' : 'text-text-secondary hover:text-text',
                )}
              >
                <GlobeIcon />
                <span>국가</span>
              </button>

              {/* Country flyout */}
              <div
                className={cn(
                  'absolute bottom-full right-0 mb-2 w-40 rounded-card bg-surface-card border border-border shadow-dropdown transition-all duration-200 origin-bottom-right',
                  countryOpen
                    ? 'opacity-100 scale-100 pointer-events-auto'
                    : 'opacity-0 scale-95 pointer-events-none',
                )}
              >
                <ul className="py-1">
                  {COUNTRIES.filter((c) => c.code !== 'all').map((country) => {
                    const href = country.code === 'global' ? '/world' : `/${country.code}`;
                    return (
                      <li key={country.code}>
                        <Link
                          href={href}
                          onClick={() => setCountryOpen(false)}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                            isActive(href)
                              ? 'text-accent bg-accent/5'
                              : 'text-text-secondary hover:text-text hover:bg-surface-elevated',
                          )}
                        >
                          <span>{country.label}</span>
                          <span className="text-text-muted text-xs">{country.labelEn}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon components (inline SVG, no external deps)                     */
/* ------------------------------------------------------------------ */

function SearchIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function ChartIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.732-3.558" />
    </svg>
  );
}
