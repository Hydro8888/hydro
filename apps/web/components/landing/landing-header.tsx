'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '#features', label: '기능' },
  { href: '#models', label: '모델' },
  { href: '#pricing', label: '요금제' },
  { href: '#faq', label: 'FAQ' },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
      scrolled
        ? 'bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800'
        : 'bg-transparent border-b border-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center shadow-xs">
            <span className="text-white dark:text-gray-900 font-bold text-xs tracking-tighter">AI</span>
          </div>
          <span className="font-semibold text-base text-gray-900 dark:text-white">AI Portal Pro</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Button href="/sign-in" variant="tertiary" size="md">
            로그인
          </Button>
          <Button href="/chat" variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
            무료로 시작하기
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="메뉴 열기/닫기"
          aria-expanded={mobileOpen}
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 py-4 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-gray-100 dark:border-gray-800">
            <Button href="/sign-in" variant="secondary" size="md" className="w-full">로그인</Button>
            <Button href="/chat" variant="primary" size="md" className="w-full">무료로 시작하기</Button>
          </div>
        </div>
      )}
    </header>
  );
}
