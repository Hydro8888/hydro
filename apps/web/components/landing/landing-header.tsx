'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '#features', label: '기능' },
  { href: '#models', label: '모델' },
  { href: '#pricing', label: '요금제' },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 50); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled
        ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50'
        : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">AI</span>
          </div>
          <span className="font-bold text-lg">AI Portal Pro</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/sign-in" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-500 transition-colors">
            로그인
          </Link>
          <Link
            href="/chat"
            className="px-5 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 shadow-lg shadow-primary-500/20 transition-all"
          >
            무료 시작
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="메뉴 열기/닫기"
          aria-expanded={mobileOpen}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 py-2"
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <Link href="/sign-in" className="text-sm font-medium text-gray-600 py-2">로그인</Link>
            <Link href="/chat" className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold">무료 시작</Link>
          </div>
        </div>
      )}
    </header>
  );
}
