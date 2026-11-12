'use client';

import { useBookmarks } from '@/hooks/useBookmarks';
import { BTN_GHOST_SM } from '@/lib/ui';
import { cn } from '@/lib/utils';
import { BookmarkIcon } from './icons';

interface BookmarkButtonProps {
  articleId: number | string;
  /** Additional CSS classes */
  className?: string;
}

/** 32px icon button. Saved = filled glyph in the text color, plus aria-pressed. */
export default function BookmarkButton({ articleId, className }: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark, hydrated } = useBookmarks();

  const active = hydrated && isBookmarked(articleId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(articleId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? '북마크 해제' : '북마크 추가'}
      aria-pressed={active}
      className={cn(BTN_GHOST_SM, 'aria-pressed:text-text', className)}
    >
      <BookmarkIcon filled={active} />
    </button>
  );
}
