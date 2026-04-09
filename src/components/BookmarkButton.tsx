'use client';

import { useState } from 'react';
import { useBookmarks } from '@/hooks/useBookmarks';

interface BookmarkButtonProps {
  articleId: number | string;
  /** Additional CSS classes */
  className?: string;
}

export default function BookmarkButton({ articleId, className = '' }: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark, hydrated } = useBookmarks();
  const [animating, setAnimating] = useState(false);

  const active = hydrated && isBookmarked(articleId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    toggleBookmark(articleId);
    // Reset animation class after it completes
    setTimeout(() => setAnimating(false), 300);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? '북마크 해제' : '북마크 추가'}
      aria-pressed={active}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full
        transition-colors duration-200
        ${active
          ? 'text-accent bg-accent/15 hover:bg-accent/25'
          : 'text-text-muted bg-surface/60 hover:text-text hover:bg-surface-elevated/80'
        }
        backdrop-blur-sm
        ${animating ? 'animate-bookmark-pop' : ''}
        ${className}`}
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    </button>
  );
}
