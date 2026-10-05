'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MAIN_MENU, COUNTRIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { formatKstClock, isAdminPath } from '@/lib/site';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useSiteStats } from '@/hooks/useSiteStats';
import SearchBar from './SearchBar';

/* ------------------------------------------------------------------ */
/*  Live clock (KST, updates every second)                             */
/* ------------------------------------------------------------------ */
// Fixed to KST like every article timestamp on the site — independent of the viewer's TZ/ICU.
function LiveClock() {
  const [clock, setClock] = useState<{ label: string; dateTime: string } | null>(null);

  useEffect(() => {
    const tick = () => setClock(formatKstClock(Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // null until mounted → server HTML and first client render match
  if (!clock) return null;
  return (
    <time
      dateTime={clock.dateTime}
      className="hidden md:flex items-center gap-1.5 text-caption text-text-muted tabular-nums select-none"
    >
      <span aria-hidden="true" className="inline-block h-1 w-1 rounded-full bg-accent-green animate-pulse-dot" />
      {clock.label}
      <span className="text-[10px] font-semibold tracking-wider text-text-muted">KST</span>
    </time>
  );
}

/* ------------------------------------------------------------------ */
/*  Live stats counter (public /api/stats, request shared w/ Footer)   */
/* ------------------------------------------------------------------ */
function LiveStats() {
  const stats = useSiteStats();
  if (!stats) return null;

  return (
    <span className="hidden sm:inline-flex items-center gap-1.5 text-caption text-text-secondary tabular-nums select-none">
      <span aria-hidden="true" className="inline-block h-1 w-1 rounded-full bg-accent animate-pulse-dot" />
      오늘 <span className="font-semibold text-accent">{stats.articlesToday.toLocaleString('ko-KR')}</span>건 업데이트
      <span aria-hidden="true" className="text-text-muted mx-0.5">·</span>
      전체 <span className="font-semibold text-text">{stats.totalArticles.toLocaleString('ko-KR')}</span>건
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop nav items (exclude search, ranking from main strip)        */
/* ------------------------------------------------------------------ */
const NAV_ITEMS = MAIN_MENU.filter(
  (m) => m.href !== '/search' && m.href !== '/ranking',
);

const SEARCH_ID = 'site-search';
const MOBILE_MENU_ID = 'site-mobile-menu';
const COUNTRY_MENU_ID = 'site-country-menu';

/* ------------------------------------------------------------------ */
/*  Header (site chrome is not rendered on /admin/* — admin layout     */
/*  has its own bar). usePathname is available during SSR, so the      */
/*  chrome is absent from the server HTML too.                          */
/* ------------------------------------------------------------------ */
export default function Header() {
  const pathname = usePathname();
  if (isAdminPath(pathname)) return null;
  return <SiteHeader />;
}

/** Keyboard (focus-visible) focus only — a mouse click on a nav link must not pin the header open. */
function isKeyboardFocus(el: Element): boolean {
  try {
    return el.matches(':focus-visible');
  } catch {
    return true;
  }
}

function SiteHeader() {
  const pathname = usePathname();
  const scrollDir = useScrollDirection(20);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const countryRef = useRef<HTMLLIElement>(null);
  const navScrollRef = useRef<HTMLUListElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchBtnDesktopRef = useRef<HTMLButtonElement>(null);
  const searchBtnMobileRef = useRef<HTMLButtonElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const countryBtnRef = useRef<HTMLButtonElement>(null);
  // Which toggle opened the search bar (focus returns there on ESC)
  const searchOpenerRef = useRef<HTMLButtonElement | null>(null);
  // Latest open state for the window keydown listener (registered once)
  const openRef = useRef({ mobileOpen, searchOpen, countryOpen });
  openRef.current = { mobileOpen, searchOpen, countryOpen };

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

  // Keyboard shortcuts: '/' opens search (as advertised by the kbd hint),
  // ESC closes overlays and returns focus to the toggle that opened them
  useEffect(() => {
    const visibleSearchToggle = () => {
      const d = searchBtnDesktopRef.current;
      return d && d.offsetParent !== null ? d : searchBtnMobileRef.current;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const open = openRef.current;
        if (!open.mobileOpen && !open.searchOpen && !open.countryOpen) return;
        const returnTo = open.countryOpen
          ? countryBtnRef.current
          : open.mobileOpen
            ? menuBtnRef.current
            : searchOpenerRef.current ?? visibleSearchToggle();
        setSearchOpen(false);
        setMobileOpen(false);
        setCountryOpen(false);
        returnTo?.focus();
        return;
      }
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      e.preventDefault();
      searchOpenerRef.current = visibleSearchToggle();
      setSearchOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Focus the search input when the search bar expands
  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => {
      searchWrapRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    }, 80);
    return () => clearTimeout(t);
  }, [searchOpen]);

  // Auto-scroll active nav item into view. Scroll the strip itself (ul.scrollTo) instead of
  // Element.scrollIntoView, which in Chromium moves the sequential-focus starting point to the
  // active link — the first Tab would then skip the "본문 바로가기" link.
  useEffect(() => {
    const ul = navScrollRef.current;
    if (!ul || ul.scrollWidth <= ul.clientWidth) return;
    const active = ul.querySelector<HTMLElement>('[data-active="true"]');
    if (active) {
      const a = active.getBoundingClientRect();
      const box = ul.getBoundingClientRect();
      ul.scrollTo({ left: ul.scrollLeft + (a.left - box.left) - (ul.clientWidth - a.width) / 2, behavior: 'smooth' });
    }
  }, [pathname]);

  const isActive = useCallback((href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }, [pathname]);

  const toggleSearch = (opener: HTMLButtonElement | null) => {
    searchOpenerRef.current = opener;
    setSearchOpen((v) => !v);
  };

  // Never collapse while keyboard focus is inside the header (WCAG 2.4.11 — focus not obscured)
  const collapsed = scrollDir === 'down' && !mobileOpen && !searchOpen && !focusWithin;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full bg-surface/95 backdrop-blur-md border-b border-border transition-transform duration-300',
          // Collapse by the exact tier-1 height (h-12): desktop keeps the nav strip
          // pinned, mobile hides the header fully — no clipped sliver remains.
          collapsed && '-translate-y-12',
        )}
        style={{ '--nav-h': '40px' } as React.CSSProperties}
        onFocus={(e) => setFocusWithin(isKeyboardFocus(e.target))}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
        }}
      >
        {/* -- Tier 1: Logo + clock + search toggle ------------------- */}
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="flex h-12 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-0.5 select-none group">
              <span className="text-xl font-extrabold tracking-tight transition-colors">
                <span className="text-accent-red group-hover:text-accent-red/80">Live</span><span className="text-accent-blue group-hover:text-accent-blue/80">News</span>
              </span>
              <span className="text-lg font-medium tracking-tight text-text-secondary">.co.kr</span>
              <span aria-hidden="true" className="ml-1.5 h-1.5 w-1.5 rounded-full bg-accent-red animate-pulse-dot" />
            </Link>

            {/* Live stats counter */}
            <div className="hidden sm:flex ml-3 flex-1 max-w-[320px] items-center">
              <LiveStats />
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-2">
              <LiveClock />

              {/* Search toggle (desktop) */}
              <button
                ref={searchBtnDesktopRef}
                type="button"
                aria-label="검색"
                aria-expanded={searchOpen}
                aria-controls={SEARCH_ID}
                onClick={() => toggleSearch(searchBtnDesktopRef.current)}
                className={cn(
                  'hidden sm:flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-caption transition-all duration-200',
                  searchOpen
                    ? 'border-accent text-accent bg-accent/5'
                    : 'border-border text-text-secondary hover:border-text-muted hover:text-text',
                )}
              >
                <SearchIcon className="h-3.5 w-3.5" />
                <span>검색</span>
                <kbd aria-hidden="true" className="hidden lg:inline-block ml-1 px-1.5 py-0.5 text-[10px] rounded bg-surface-elevated text-text-muted border border-border-muted">
                  /
                </kbd>
              </button>

              {/* Search toggle (mobile) */}
              <button
                ref={searchBtnMobileRef}
                type="button"
                aria-label="검색"
                aria-expanded={searchOpen}
                aria-controls={SEARCH_ID}
                onClick={() => toggleSearch(searchBtnMobileRef.current)}
                className="sm:hidden p-2 rounded-md text-text-secondary hover:text-accent hover:bg-surface-elevated transition-colors"
              >
                <SearchIcon className="h-5 w-5" />
              </button>

              {/* Hamburger (mobile/tablet) */}
              <button
                ref={menuBtnRef}
                type="button"
                aria-label="메뉴"
                aria-expanded={mobileOpen}
                aria-controls={MOBILE_MENU_ID}
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden p-2 rounded-md text-text-secondary hover:text-accent hover:bg-surface-elevated transition-colors"
              >
                <div aria-hidden="true" className="relative w-5 h-5 flex flex-col items-center justify-center">
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

          {/* Expandable search bar — `invisible` when closed removes it from Tab order / AT */}
          <div
            id={SEARCH_ID}
            ref={searchWrapRef}
            className={cn(
              'overflow-hidden transition-[max-height,opacity,visibility,padding] duration-300 ease-in-out',
              searchOpen ? 'visible max-h-20 pb-3 opacity-100' : 'invisible max-h-0 opacity-0',
            )}
          >
            <SearchBar placeholder="뉴스 검색..." />
          </div>
        </div>

        {/* -- Tier 2: Nav bar (desktop) -------------------------------- */}
        <nav
          aria-label="주요 메뉴"
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
                      aria-current={active ? 'page' : undefined}
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
                        aria-label="Hacker News (새 창)"
                        className="nav-link inline-flex items-center gap-1 whitespace-nowrap text-accent-green font-semibold hover:text-accent-green/80 transition-colors ml-1"
                      >
                        Hacker News
                        <ExternalIcon className="h-3 w-3" />
                      </a>
                    )}
                  </li>
                );
              })}

              {/* Ranking link at end with separator */}
              <li className="ml-auto flex items-center gap-2">
                <span aria-hidden="true" className="h-4 w-px bg-border-muted" />
                <Link
                  href="/ranking"
                  aria-current={isActive('/ranking') ? 'page' : undefined}
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
        {/* Open: scrolls inside the viewport (landscape phones) above the bottom tab bar.
            Closed: `invisible` removes it from Tab order / AT. */}
        <div
          id={MOBILE_MENU_ID}
          className={cn(
            'lg:hidden transition-[max-height,opacity,visibility] duration-300 ease-in-out border-t border-border-muted bg-surface-card',
            mobileOpen
              ? 'visible max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain opacity-100'
              : 'invisible max-h-0 overflow-hidden opacity-0 border-t-0',
          )}
        >
          <nav aria-label="모바일 메뉴" className="mx-auto max-w-screen-xl px-4 py-3">
            <p className="text-overline text-text-muted uppercase tracking-widest mb-2 px-1">
              카테고리
            </p>
            <ul className="grid grid-cols-3 sm:grid-cols-4 gap-1">
              {MAIN_MENU.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center justify-center rounded-card px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-accent/10 text-accent'
                          : 'text-text-secondary hover:bg-surface-elevated hover:text-text',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Hacker News link in mobile */}
            <a
              href="https://hacker.ai.kr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hacker News (새 창)"
              className="flex items-center gap-2 rounded-card px-3 py-2.5 mt-2 text-sm font-semibold text-accent-green bg-accent-green/10 hover:bg-accent-green/20 transition-colors"
            >
              Hacker News
              <ExternalIcon className="h-3.5 w-3.5" />
            </a>

            {/* Country section in mobile menu */}
            <p className="text-overline text-text-muted uppercase tracking-widest mt-4 mb-2 px-1">
              국가별
            </p>
            <ul className="flex gap-2 px-1 pb-1">
              {COUNTRIES.filter((c) => c.code !== 'all').map((country) => {
                const href = country.code === 'global' ? '/world' : `/${country.code}`;
                const active = isActive(href);
                return (
                  <li key={country.code}>
                    <Link
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors',
                        active
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
        <nav aria-label="하단 탭 메뉴" className="mx-auto max-w-md">
          <ul className="flex items-center justify-around h-14">
            {/* Home */}
            <li>
              <Link
                href="/"
                aria-current={isActive('/') ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors',
                  isActive('/') ? 'text-accent' : 'text-text-secondary hover:text-text',
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
                aria-current={isActive('/breaking') ? 'page' : undefined}
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
                aria-current={isActive('/search') ? 'page' : undefined}
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
                ref={countryBtnRef}
                type="button"
                aria-expanded={countryOpen}
                aria-controls={COUNTRY_MENU_ID}
                aria-haspopup="true"
                onClick={() => setCountryOpen((v) => !v)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors',
                  countryOpen ? 'text-accent' : 'text-text-secondary hover:text-text',
                )}
              >
                <GlobeIcon />
                <span>국가</span>
              </button>

              {/* Country flyout — `invisible` when closed removes it from Tab order / AT */}
              <div
                id={COUNTRY_MENU_ID}
                className={cn(
                  'absolute bottom-full right-0 mb-2 w-40 rounded-card bg-surface-card border border-border shadow-dropdown transition-[opacity,transform,visibility] duration-200 origin-bottom-right',
                  countryOpen
                    ? 'visible opacity-100 scale-100 pointer-events-auto'
                    : 'invisible opacity-0 scale-95 pointer-events-none',
                )}
              >
                <ul className="py-1">
                  {COUNTRIES.filter((c) => c.code !== 'all').map((country) => {
                    const href = country.code === 'global' ? '/world' : `/${country.code}`;
                    const active = isActive(href);
                    return (
                      <li key={country.code}>
                        <Link
                          href={href}
                          onClick={() => setCountryOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                            active
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
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function ChartIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.732-3.558" />
    </svg>
  );
}

function ExternalIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
