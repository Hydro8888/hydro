'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MAIN_MENU, COUNTRIES } from '@/lib/constants';
import { cn, formatCount } from '@/lib/utils';
import { formatKstClock, isAdminPath } from '@/lib/site';
import { CHIP, CHIP_CURRENT, NUM } from '@/lib/ui';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { useSiteStats } from '@/hooks/useSiteStats';
import SearchBar from './SearchBar';
import { BoltIcon, CloseIcon, ExternalIcon, GlobeIcon, HomeIcon, MenuIcon, SearchIcon } from './icons';

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
  // The label ends with the time ('10월 6일 (화) 00:14:05'): the time and zone are set in the mono
  // face, the date stays in the interface face. One inline run → name '10월 6일 (화) 00:14:05 KST'.
  const cut = clock.label.lastIndexOf(' ');
  return (
    <time
      dateTime={clock.dateTime}
      className="hidden select-none whitespace-nowrap text-caption tabular-nums text-text-muted md:block"
    >
      {clock.label.slice(0, cut)}{' '}
      <span className="font-mono">{clock.label.slice(cut + 1)} KST</span>
    </time>
  );
}

/* ------------------------------------------------------------------ */
/*  Live stats counter (public /api/stats, request shared w/ Footer)   */
/* ------------------------------------------------------------------ */
function LiveStats() {
  const stats = useSiteStats();
  if (!stats) return null;

  // One sentence in one format: '오늘 344건 업데이트 · 전체 164,917건'. Only the figures are mono.
  return (
    <p className="select-none truncate text-caption text-text-secondary">
      오늘 <span className={cn(NUM, 'text-text')}>{formatCount(stats.articlesToday)}</span>건 업데이트{' '}
      <span aria-hidden="true" className="mx-1 text-text-muted">·</span>{' '}
      전체 <span className={cn(NUM, 'text-text')}>{formatCount(stats.totalArticles)}</span>건
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop nav items (exclude search, ranking from main strip)        */
/* ------------------------------------------------------------------ */
const NAV_ITEMS = MAIN_MENU.filter(
  (m) => m.href !== '/search' && m.href !== '/ranking',
);

// Country pages, shared by the mobile menu and the bottom-tab flyout.
const COUNTRY_LINKS = COUNTRIES.filter((c) => c.code !== 'all').map((c) => ({
  ...c,
  href: c.code === 'global' ? '/world' : `/${c.code}`,
}));

// Page container shared with the footer and every page (UNSLOP-AUDIT §7-6).
const CONTAINER = 'mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8';

// Desktop nav: every link is the same 40px box (the 2px bottom border is always there, only its
// color changes), so the labels share one baseline. The accent marks the current page only.
// The row scrolls sideways and would clip an outer focus outline, so it is drawn inside.
const NAV_LINK =
  'inline-flex h-10 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors focus-visible:-outline-offset-2';
const NAV_IDLE = 'border-transparent text-text-secondary hover:text-text';
const NAV_ACTIVE = 'border-accent text-accent';

// 40px touch target around a 16px icon.
const ICON_BTN =
  'inline-flex h-10 w-10 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text';

// Bottom tab: the whole 56px cell is the touch target.
const TAB =
  'flex h-14 w-full flex-col items-center justify-center gap-1 text-caption font-medium transition-colors focus-visible:-outline-offset-2';
const TAB_IDLE = 'text-text-secondary hover:text-text';

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

  // The "국가" tab marks the current location (a country page), not the open state of its flyout.
  const countryActive = COUNTRY_LINKS.some((c) => isActive(c.href));

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full border-b border-border bg-surface transition-transform duration-200',
          // Collapse by the exact tier-1 height (h-12): desktop keeps the nav strip
          // pinned, mobile hides the header fully — no clipped sliver remains.
          collapsed && '-translate-y-12',
        )}
        onFocus={(e) => setFocusWithin(isKeyboardFocus(e.target))}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
        }}
      >
        {/* -- Tier 1: wordmark + stats + clock + search toggle --------- */}
        <div className={CONTAINER}>
          <div className="flex h-12 items-center justify-between">
            {/* Wordmark: the product name in the interface face; the domain suffix is secondary text */}
            <Link href="/" className="inline-flex h-8 select-none items-center text-lg font-semibold text-text">
              LiveNews<span className="text-text-secondary">.co.kr</span>
            </Link>

            {/* Stats sentence, next to the wordmark */}
            <div className="mx-4 hidden min-w-0 flex-1 sm:block">
              <LiveStats />
            </div>

            {/* Right cluster. -mr-3: the 16px icon inside the last 40px button sits on the page edge line */}
            <div className="-mr-3 flex items-center gap-2 lg:mr-0">
              <LiveClock />

              {/* Search toggle (desktop). Open = one surface step, driven by aria-expanded */}
              <button
                ref={searchBtnDesktopRef}
                type="button"
                aria-label="검색"
                aria-expanded={searchOpen}
                aria-controls={SEARCH_ID}
                onClick={() => toggleSearch(searchBtnDesktopRef.current)}
                className={cn(CHIP, 'hidden gap-2 aria-expanded:bg-surface-elevated aria-expanded:text-text sm:inline-flex')}
              >
                <SearchIcon />
                <span>검색</span>
                <kbd
                  aria-hidden="true"
                  className="ml-1 hidden h-5 min-w-5 items-center justify-center rounded-tag border border-border bg-surface px-1 font-mono text-meta text-text-muted lg:inline-flex"
                >
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
                className={cn(ICON_BTN, 'sm:hidden')}
              >
                <SearchIcon />
              </button>

              {/* Menu (mobile/tablet) */}
              <button
                ref={menuBtnRef}
                type="button"
                aria-label="메뉴"
                aria-expanded={mobileOpen}
                aria-controls={MOBILE_MENU_ID}
                onClick={() => setMobileOpen((v) => !v)}
                className={cn(ICON_BTN, 'lg:hidden')}
              >
                {mobileOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          {/* Expandable search bar — `invisible` when closed removes it from Tab order / AT.
              Only opacity is animated; open has no overflow clipping, so the input's focus outline shows on all four sides. */}
          <div
            id={SEARCH_ID}
            ref={searchWrapRef}
            className={cn(
              'transition-opacity duration-200',
              searchOpen ? 'visible pb-3 opacity-100' : 'invisible h-0 overflow-hidden opacity-0',
            )}
          >
            <SearchBar />
          </div>
        </div>

        {/* -- Tier 2: Nav bar (desktop) -------------------------------- */}
        <nav aria-label="주요 메뉴" className="hidden border-t border-border-muted lg:block">
          <div className={CONTAINER}>
            {/* -mx-3 cancels the links' own px-3: the first label starts on the wordmark's left edge
                and "랭킹" ends on the right edge of the search toggle */}
            <ul ref={navScrollRef} className="-mx-3 flex h-10 items-center overflow-x-auto scrollbar-none">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href} className="flex">
                    <Link
                      href={item.href}
                      data-active={active}
                      aria-current={active ? 'page' : undefined}
                      className={cn(NAV_LINK, active ? NAV_ACTIVE : NAV_IDLE)}
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
                        className={cn(NAV_LINK, NAV_IDLE)}
                      >
                        Hacker News
                        <ExternalIcon />
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
                  className={cn(NAV_LINK, isActive('/ranking') ? NAV_ACTIVE : NAV_IDLE)}
                >
                  랭킹
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* -- Mobile menu ---------------------------------------------- */}
        {/* Open: scrolls inside the viewport (landscape phones) above the bottom tab bar.
            Closed: `invisible` removes it from Tab order / AT. Only opacity is animated. */}
        <div
          id={MOBILE_MENU_ID}
          className={cn(
            'bg-surface-card transition-opacity duration-200 lg:hidden',
            mobileOpen
              ? 'visible max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain border-t border-border-muted opacity-100'
              : 'invisible max-h-0 overflow-hidden opacity-0',
          )}
        >
          <nav aria-label="모바일 메뉴" className={cn(CONTAINER, 'py-4')}>
            <p className="mb-2 text-overline text-text-muted">카테고리</p>
            <ul className="grid grid-cols-3 gap-1 sm:grid-cols-4">
              {MAIN_MENU.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-10 items-center justify-center rounded-control px-3 text-sm font-medium transition-colors',
                        active
                          ? 'bg-surface-elevated text-accent'
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
              className="mt-2 flex h-10 items-center gap-2 rounded-control px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text"
            >
              Hacker News
              <ExternalIcon />
            </a>

            {/* Country section in mobile menu */}
            <p className="mb-2 mt-6 text-overline text-text-muted">국가별</p>
            <ul className="flex flex-wrap gap-2">
              {COUNTRY_LINKS.map((country) => {
                const active = isActive(country.href);
                return (
                  <li key={country.code} className="flex">
                    <Link
                      href={country.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={active ? CHIP_CURRENT : CHIP}
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

      {/* -- Mobile bottom tabs (fixed) -------------------------------- */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-deep safe-area-bottom lg:hidden">
        <nav aria-label="하단 탭 메뉴" className="mx-auto max-w-md">
          <ul className="grid h-14 grid-cols-4">
            {/* Home */}
            <li>
              <Link
                href="/"
                aria-current={isActive('/') ? 'page' : undefined}
                className={cn(TAB, isActive('/') ? 'text-accent' : TAB_IDLE)}
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
                className={cn(TAB, isActive('/breaking') ? 'text-accent' : TAB_IDLE)}
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
                className={cn(TAB, isActive('/search') ? 'text-accent' : TAB_IDLE)}
              >
                <SearchIcon />
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
                className={cn(TAB, countryActive ? 'text-accent' : countryOpen ? 'text-text' : TAB_IDLE)}
              >
                <GlobeIcon />
                <span>국가</span>
              </button>

              {/* Country flyout — `invisible` when closed removes it from Tab order / AT.
                  Card radius 12 − 4px inset = row radius 8. */}
              <div
                id={COUNTRY_MENU_ID}
                className={cn(
                  'absolute bottom-full right-4 mb-2 w-40 rounded-card border border-border bg-surface-card p-1 shadow-float transition-[transform,opacity] duration-200',
                  countryOpen
                    ? 'visible translate-y-0 opacity-100'
                    : 'pointer-events-none invisible translate-y-1 opacity-0',
                )}
              >
                <ul>
                  {COUNTRY_LINKS.map((country) => {
                    const active = isActive(country.href);
                    return (
                      <li key={country.code}>
                        <Link
                          href={country.href}
                          onClick={() => setCountryOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex h-10 items-center justify-between rounded-control px-3 text-sm transition-colors',
                            active
                              ? 'bg-surface-elevated text-accent'
                              : 'text-text-secondary hover:bg-surface-elevated hover:text-text',
                          )}
                        >
                          <span>{country.label}</span>
                          <span className="text-caption text-text-muted">{country.labelEn}</span>
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
