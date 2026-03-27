'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 glass-strong">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)]">
            <span className="text-lg font-bold text-white">Y</span>
          </div>
          <span className="text-xl font-bold">
            <span className="text-gradient">여우</span>
            <span className="text-gradient-gold">알바</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { href: '/jobs/', label: '알바찾기' },
            { href: '/recommend/', label: '맞춤알바' },
            { href: '/community/', label: '커뮤니티' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-4 py-2 text-sm text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/my/"
            className="hidden h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] md:flex"
          >
            <Bell className="h-5 w-5" />
          </Link>
          <Link
            href="/login/"
            className="hidden rounded-xl bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] px-5 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-[var(--accent-blue)]/25 md:block"
          >
            로그인
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-card)] md:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isSearchOpen && (
        <div className="border-t border-[var(--border-glass)] px-4 py-3">
          <div className="mx-auto max-w-2xl">
            <div className="glass flex items-center gap-2 px-4 py-2.5">
              <Search className="h-4 w-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="지역, 업종, 키워드로 검색..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="border-t border-[var(--border-glass)] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {[
              { href: '/jobs/', label: '알바찾기' },
              { href: '/recommend/', label: '맞춤알바' },
              { href: '/community/', label: '커뮤니티' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-xl px-4 py-3 text-sm hover:bg-[var(--bg-card)]" onClick={() => setIsMobileMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/login/" className="mt-2 rounded-xl bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] px-4 py-3 text-center text-sm font-medium text-white" onClick={() => setIsMobileMenuOpen(false)}>
              로그인
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
