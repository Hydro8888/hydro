'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { MAIN_MENU } from '@/lib/constants';
import SearchBar from './SearchBar';

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-200">
      {/* Top bar */}
      <div className="mx-auto max-w-screen-xl px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 select-none">
            <span className="text-2xl font-extrabold tracking-tight text-blue-600">Live</span>
            <span className="text-2xl font-extrabold tracking-tight text-gray-900">News</span>
          </Link>

          {/* Desktop search + hamburger */}
          <div className="flex items-center gap-3">
            {/* Inline search toggle (desktop) */}
            <button
              aria-label="검색"
              onClick={() => setSearchOpen((v) => !v)}
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
              <span>뉴스 검색</span>
            </button>

            {/* Mobile: search icon only */}
            <button
              aria-label="검색"
              onClick={() => setSearchOpen((v) => !v)}
              className="sm:hidden p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
            </button>

            {/* Hamburger */}
            <button
              aria-label="메뉴"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-colors"
            >
              {mobileOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Expandable search bar */}
        {searchOpen && (
          <div className="pb-3">
            <SearchBar placeholder="검색어를 입력하세요" />
          </div>
        )}
      </div>

      {/* Main nav (desktop) */}
      <div className="hidden lg:block border-t border-gray-100 bg-white">
        <nav className="mx-auto max-w-screen-xl px-4">
          <ul className="flex items-center gap-0">
            {MAIN_MENU.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`relative inline-flex items-center px-3.5 py-3 text-sm font-medium transition-colors
                    ${
                      isActive(item.href)
                        ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <nav className="mx-auto max-w-screen-xl px-4 py-2">
            <ul className="grid grid-cols-3 gap-1 sm:grid-cols-4">
              {MAIN_MENU.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors
                      ${
                        isActive(item.href)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                      }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
