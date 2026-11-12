'use client';

import { BTN_GHOST_SM } from '@/lib/ui';
import { formatWireTime, toIsoDateTime } from '@/lib/utils';
import type { Article } from '@/lib/types';
import BookmarkButton from './BookmarkButton';
import { ExternalIcon } from './icons';

/** Bottom row of NewsCard / NewsCardLarge: source and wire time, then the two icon actions. */
export default function NewsCardMeta({ article }: { article: Pick<Article, 'id' | 'source' | 'publishedAt' | 'originalUrl'> }) {
  const isoDate = toIsoDateTime(article.publishedAt);
  const wire = formatWireTime(article.publishedAt);

  return (
    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
      <p className="flex min-w-0 items-center gap-2 text-caption">
        <span className="truncate text-text-secondary">{article.source.sourceName}</span>
        {isoDate && wire && (
          <>
            <span aria-hidden="true" className="text-text-muted">
              ·
            </span>
            {/* The wire time depends on today's date, so server and client can differ around midnight KST. */}
            <time dateTime={isoDate} suppressHydrationWarning className="dateline shrink-0 whitespace-nowrap">
              {wire}
            </time>
          </>
        )}
      </p>
      {/* Above the card's stretched title link. The 32px buttons hang 8px outside the row (-my-2, -mr-2),
          so the row is as tall as its text line and the 16px glyphs sit on the card's content edge. */}
      <div className="relative z-10 -my-2 -mr-2 flex shrink-0 items-center">
        <a
          href={article.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="원문 보기 (새 창)"
          title="원문 보기"
          className={BTN_GHOST_SM}
        >
          <ExternalIcon />
        </a>
        <BookmarkButton articleId={article.id} />
      </div>
    </div>
  );
}
