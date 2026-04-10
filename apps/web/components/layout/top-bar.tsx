'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import {
  Menu,
  PanelRightClose,
  PanelRightOpen,
  Moon,
  Sun,
  Monitor,
  User,
  Settings,
  CreditCard,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';

export function TopBar() {
  const {
    sidebarOpen,
    contextPanelOpen,
    toggleSidebar,
    toggleContextPanel,
    theme,
    setTheme,
  } = useUIStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
      setDropdownOpen(false);
    }
  }

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [dropdownOpen]);

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-gray-950 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center shadow-xs">
            <span className="text-white dark:text-gray-900 font-bold text-xs">AI</span>
          </div>
          <span className="font-semibold text-base hidden sm:block text-gray-900 dark:text-white">
            AI Portal Pro
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* Pro upgrade — Untitled UI style */}
        <Button
          href="/billing"
          variant="primary"
          size="sm"
          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          className="hidden sm:inline-flex"
        >
          Pro 업그레이드
        </Button>

        <button
          onClick={() => {
            const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
            setTheme(next);
          }}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
          aria-label="Toggle theme"
          title={`테마: ${theme === 'light' ? '라이트' : theme === 'dark' ? '다크' : '시스템'}`}
        >
          {theme === 'dark' ? (
            <Moon className="w-4 h-4" />
          ) : theme === 'system' ? (
            <Monitor className="w-4 h-4" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={toggleContextPanel}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors hidden md:block"
          aria-label="Toggle context panel"
        >
          {contextPanelOpen ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </button>

        {/* User dropdown */}
        <div ref={dropdownRef} className="relative ml-1" onBlur={handleBlur}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-1 p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            aria-label="User menu"
            aria-expanded={dropdownOpen}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-200 dark:to-white flex items-center justify-center">
              <User className="w-4 h-4 text-white dark:text-gray-900" />
            </div>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">사용자</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Free 플랜</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md mx-1"
              >
                <Settings className="w-4 h-4" />
                설정
              </Link>
              <Link
                href="/billing"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md mx-1"
              >
                <CreditCard className="w-4 h-4" />
                요금제
              </Link>
              <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                <div className="px-3 py-2 text-xs text-gray-400">로그아웃 (준비 중)</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
