'use client';

import { useEffect } from 'react';
import { TopBar } from './top-bar';
import { Sidebar } from './sidebar';
import { useUIStore } from '@/stores/ui-store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  // Close sidebar on small screens by default
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && sidebarOpen) {
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

        {/* Sidebar: hidden when closed on desktop, slide overlay on mobile */}
        {sidebarOpen && (
          <div className="fixed md:relative z-50 md:z-auto h-[calc(100vh-3.5rem)] md:h-auto">
            <Sidebar />
          </div>
        )}

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
