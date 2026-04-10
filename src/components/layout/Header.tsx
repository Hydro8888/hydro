'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: '홈', href: '/simburum' },
  { label: '서비스 소개', href: '/simburum/services' },
  { label: '우수 사례', href: '/simburum/cases' },
  { label: '안전·신뢰', href: '/simburum/trust' },
  { label: '요금 안내', href: '/simburum/pricing' },
  { label: '헬퍼 지원', href: '/simburum/helper-apply' },
  { label: '고객지원', href: '/simburum/support' },
];

interface HeaderProps {
  user?: {
    name: string;
    role: string;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/simburum"
            className="flex items-center gap-2 shrink-0"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              심부름
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/simburum/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  대시보드
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <div className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-700">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/simburum/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/simburum/auth/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
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

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="px-4 py-3 border-t border-gray-100 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-700">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {user.name}
                  </span>
                </div>
                <Link
                  href="/simburum/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  대시보드
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/simburum/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/simburum/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
