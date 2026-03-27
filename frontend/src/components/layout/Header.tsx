'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell, Search, User, Menu, X } from 'lucide-react';

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">
            <span className="text-primary">여우</span>
            <span className="text-accent">알바</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/jobs" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            알바찾기
          </Link>
          <Link href="/recommend" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            맞춤알바
          </Link>
          <Link href="/community" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            커뮤니티
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/my"
            className="hidden rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:block"
          >
            <Bell className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="hidden rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-primary-light md:block"
          >
            로그인
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Search Bar (expandable) */}
      {isSearchOpen && (
        <div className="border-t border-border bg-background px-4 py-3">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="지역, 업종, 키워드로 검색..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link href="/jobs" className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setIsMobileMenuOpen(false)}>
              알바찾기
            </Link>
            <Link href="/recommend" className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setIsMobileMenuOpen(false)}>
              맞춤알바
            </Link>
            <Link href="/community" className="rounded-lg px-3 py-2 text-sm hover:bg-muted" onClick={() => setIsMobileMenuOpen(false)}>
              커뮤니티
            </Link>
            <hr className="border-border" />
            <Link
              href="/login"
              className="rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              로그인
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
