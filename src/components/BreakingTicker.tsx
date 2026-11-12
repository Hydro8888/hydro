'use client';

import Link from 'next/link';
import type { TickerArticle } from '@/lib/types';
import { getDisplayTitle } from '@/lib/utils';

interface BreakingTickerProps {
  articles: TickerArticle[];
}

export default function BreakingTicker({ articles }: BreakingTickerProps) {
  if (!articles || articles.length === 0) return null;

  const items = articles.slice(0, 10);
  // Duplicate so the seamless loop works even with few items
  const doubled = [...items, ...items];

  return (
    // `news-ticker` carries no style: it marks the one place where a scroll animation and a fade are expected.
    <div
      className="news-ticker flex h-10 w-full items-stretch overflow-hidden border-y border-border bg-surface"
      role="marquee"
      aria-label="속보"
    >
      <div className="flex flex-none items-center border-r border-border px-4">
        <span className="whitespace-nowrap text-overline text-live">속보</span>
      </div>

      {/* Scrolling track. Both ends fade into the band's own surface color. */}
      <div className="relative flex flex-1 items-center overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-surface to-surface/0" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-surface to-surface/0" />

        <ul className="ticker-track flex min-w-max animate-ticker items-center" aria-label="속보 뉴스 목록">
          {doubled.map((article, idx) => {
            const t = getDisplayTitle(article);
            return (
              <li key={`${article.id}-${idx}`} className="flex items-center whitespace-nowrap" aria-hidden={idx >= items.length}>
                {/* The band clips its content, so the focus ring is drawn inside the link. */}
                <Link
                  href={`/article/${article.id}`}
                  tabIndex={idx >= items.length ? -1 : 0}
                  lang={t.lang}
                  className="inline-flex h-8 items-center rounded-control px-4 text-body-md text-text transition-colors hover:bg-surface-elevated focus-visible:-outline-offset-2"
                >
                  {t.text}
                </Link>
                <span className="select-none text-text-muted" aria-hidden="true">
                  ·
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <style jsx global>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          animation: ticker ${items.length * 4}s linear infinite;
        }
        .animate-ticker:hover,
        .animate-ticker:focus-within {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
