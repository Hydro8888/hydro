'use client';

import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  contextPanelOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  toggleSidebar: () => void;
  toggleContextPanel: () => void;
  setTheme: (theme: UIStore['theme']) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  contextPanelOpen: true,
  theme: 'system',

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleContextPanel: () =>
    set((state) => ({ contextPanelOpen: !state.contextPanelOpen })),

  setTheme: (theme) => set({ theme }),
}));
