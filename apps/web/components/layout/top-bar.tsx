'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { Menu, PanelRightClose, PanelRightOpen, Moon, Sun, Monitor, User, Settings, CreditCard, ChevronDown, Sparkles } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';

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

  // Close dropdown on Escape key
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [dropdownOpen]);

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 bg-white dark:bg-gray-950 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">F</span>
          </div>
          <span className="font-bold text-sm hidden sm:block">
            Free.ai.kr
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* Pro 업그레이드 버튼 — Kimi 스타일 */}
        <Link
          href="/billing"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-indigo-600 text-white text-xs font-semibold hover:from-primary-600 hover:to-indigo-700 shadow-md shadow-primary-500/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Pro 업그레이드
        </Link>
        <button
          onClick={() => {
            const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
            setTheme(next);
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Toggle context panel"
        >
          {contextPanelOpen ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </button>

        {/* User dropdown */}
        <div
          ref={dropdownRef}
          className="relative ml-1"
          onBlur={handleBlur}
        >
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-500" />
            </div>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50">
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Settings className="w-4 h-4" />
                설정
              </Link>
              <Link
                href="/billing"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <CreditCard className="w-4 h-4" />
                요금제
              </Link>
              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
              <div className="px-3 py-2 text-xs text-gray-400">
                로그아웃 (준비 중)
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
