'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: '홈', href: '/' },
  { label: '서비스 소개', href: '/services' },
  { label: '우수 사례', href: '/cases' },
  { label: '안전·신뢰', href: '/safety' },
  { label: '요금 안내', href: '/pricing' },
];

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-warm-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-indigo transition-shadow duration-300">
              <span className="text-white font-bold text-base">S</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold text-warm-900 tracking-tight">
                Simburum
              </span>
              <span className="text-[10px] text-warm-400 font-medium -mt-0.5">
                심부름
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 group ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-warm-600 hover:text-indigo-600'
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-indigo-600 rounded-full transition-all duration-300 ${
                      isActive ? 'w-4/5' : 'w-0 group-hover:w-4/5'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-warm-600 hover:text-indigo-600 transition-colors"
                >
                  대시보드
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-warm-50 border border-warm-100 rounded-full hover:bg-warm-100 transition-colors cursor-pointer">
                  <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-700">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-warm-700">
                    {user.name || '사용자'}
                  </span>
                  <svg className="w-3.5 h-3.5 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-warm-600 hover:text-indigo-600 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 rounded-xl shadow-sm hover:shadow-coral transition-all duration-300 hover:-translate-y-0.5"
                >
                  무료 시작하기
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-warm-600 hover:bg-warm-100 transition-colors"
            aria-label="메뉴 열기"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu with slide-down animation */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-warm-100/50 bg-white/95 backdrop-blur-xl">
          <nav className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                    isActive
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-warm-700 hover:text-indigo-600 hover:bg-warm-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-4 py-3 border-t border-warm-100/50 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-indigo-700">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-warm-900">
                    {user.name || '사용자'}
                  </span>
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl transition-all"
                >
                  대시보드
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-4 py-3 text-sm font-medium text-warm-700 border border-warm-200 hover:bg-warm-50 rounded-xl transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-coral-500 to-coral-600 rounded-xl transition-all"
                >
                  무료 시작하기
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
