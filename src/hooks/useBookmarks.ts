'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'livenews_bookmarks';

function readBookmarks(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBookmarks(ids: number[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // quota exceeded or unavailable — silently ignore
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    setBookmarks(readBookmarks());
    setHydrated(true);
  }, []);

  const isBookmarked = useCallback(
    (id: number | string): boolean => {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      return bookmarks.includes(numId);
    },
    [bookmarks],
  );

  const toggleBookmark = useCallback(
    (id: number | string): void => {
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      setBookmarks((prev) => {
        const next = prev.includes(numId)
          ? prev.filter((b) => b !== numId)
          : [...prev, numId];
        writeBookmarks(next);
        return next;
      });
    },
    [],
  );

  return { bookmarks, isBookmarked, toggleBookmark, hydrated };
}
