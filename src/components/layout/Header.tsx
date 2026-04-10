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
    <header className="sticky top-0 z-50">
      {/* Top utility bar */}
      <div className="bg-warm-50 border-b border-warm-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-end gap-4 h-8">
          <Link href="/support" className="text-xs text-warm-500 hover:text-teal-600 transition-colors">공지사항</Link>
          <Link href="/helper-apply" className="text-xs text-warm-500 hover:text-teal-600 transition-colors">파트너(헬퍼)</Link>
          {!user && (
            <>
              <Link href="/login" className="text-xs text-warm-500 hover:text-teal-600 transition-colors">로그인</Link>
              <Link href="/register" className="text-xs text-warm-500 hover:text-teal-600 transition-colors">회원가입</Link>
            </>
          )}
          {user && (
            <Link href="/dashboard" className="text-xs text-warm-500 hover:text-teal-600 transition-colors">마이페이지</Link>
          )}
        </div>
      </div>

      {/* Main nav bar */}
      <div className="bg-white border-b border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 shrink-0">
              <span className="text-xl font-bold text-teal-600">Simburum</span>
              <span className="text-xs text-warm-400 font-medium">심부름</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === `/simburum${item.href}` || (item.href !== '/' && pathname?.startsWith(`/simburum${item.href}`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      active ? 'text-teal-600' : 'text-warm-600 hover:text-teal-600'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link href="/dashboard" className="text-sm font-medium text-warm-600 hover:text-teal-600 transition-colors">대시보드</Link>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-warm-50 border border-warm-100 rounded-full">
                    <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-teal-700">{user.name?.charAt(0) || 'U'}</span>
                    </div>
                    <span className="text-sm font-medium text-warm-700">{user.name || '사용자'}</span>
                  </div>
                </div>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-2 text-sm font-medium text-warm-600 hover:text-teal-600 transition-colors">로그인</Link>
                  <Link href="/register" className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-full transition-colors">
                    회원가입
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-warm-600 hover:bg-warm-100 rounded-lg transition-colors"
              aria-label="메뉴"
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-[500px]' : 'max-h-0'}`}>
        <div className="bg-white border-b border-warm-200">
          <nav className="px-4 py-2 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-warm-700 hover:text-teal-600 hover:bg-warm-50 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="px-4 py-3 border-t border-warm-100 space-y-2">
            {user ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block w-full text-center py-3 text-sm font-semibold text-white bg-teal-600 rounded-lg">
                대시보드
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block w-full text-center py-3 text-sm font-medium text-warm-700 border border-warm-200 rounded-lg">
                  로그인
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="block w-full text-center py-3 text-sm font-semibold text-white bg-teal-600 rounded-lg">
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
