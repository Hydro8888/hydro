'use client';

import Link from 'next/link';

interface TickerArticle {
  id: string;
  titleKo: string | null;
  titleOriginal: string;
}

interface BreakingTickerProps {
  articles: TickerArticle[];
}

export default function BreakingTicker({ articles }: BreakingTickerProps) {
  if (!articles || articles.length === 0) return null;

  const items = articles.slice(0, 10);
  // Duplicate so the seamless loop works even with few items
  const doubled = [...items, ...items];

  return (
    <div className="flex w-full items-stretch overflow-hidden bg-white border-b border-gray-200">
      {/* "속보" badge */}
      <div className="flex flex-none items-center gap-1.5 bg-red-600 px-3 py-2 z-10">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-200 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        <span className="whitespace-nowrap text-xs font-bold tracking-wider text-white">
          속보
        </span>
      </div>

      {/* Scrolling track */}
      <div className="relative flex flex-1 items-center overflow-hidden">
        {/* Left fade mask */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-white to-transparent" />
        {/* Right fade mask */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-white to-transparent" />

        <ul
          className="ticker-track flex min-w-max animate-ticker items-center gap-0 py-2"
          aria-label="속보 뉴스 목록"
        >
          {doubled.map((article, idx) => {
            const title = article.titleKo || article.titleOriginal;
            return (
              <li
                key={`${article.id}-${idx}`}
                className="flex items-center whitespace-nowrap"
                aria-hidden={idx >= items.length}
              >
                <Link
                  href={`/article/${article.id}`}
                  tabIndex={idx >= items.length ? -1 : 0}
                  className="px-4 text-sm text-gray-800 hover:text-red-600 transition-colors"
                >
                  {title}
                </Link>
                <span className="text-gray-300 select-none" aria-hidden="true">
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
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
