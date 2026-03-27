'use client';

import Link from 'next/link';
import { Menu, PanelRightClose, PanelRightOpen, Moon, Sun, User } from 'lucide-react';
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
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
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
        <div className="ml-2 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
          <User className="w-4 h-4 text-primary-500" />
        </div>
      </div>
    </header>
  );
}
