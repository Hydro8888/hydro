'use client';

import { useEffect } from 'react';
import { TopBar } from './top-bar';
import { Sidebar } from './sidebar';
import { useUIStore } from '@/stores/ui-store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  // Close sidebar on small screens by default
  useEffect(() => {
    if (window.innerWidth < 768 && sidebarOpen) {
      toggleSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Sidebar — absolute on mobile, relative on desktop */}
        <div
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-0 md:w-0'}
            fixed md:relative z-50 md:z-auto h-full
            transition-transform duration-200 md:transition-none
            ${sidebarOpen ? 'md:flex' : 'md:hidden'}
          `}
        >
          <Sidebar />
        </div>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
