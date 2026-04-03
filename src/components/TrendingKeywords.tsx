import Link from 'next/link';

interface TrendingKeyword {
  keyword: string;
  count: number;
}

interface TrendingKeywordsProps {
  keywords: TrendingKeyword[];
}

/** Rank-based accent color classes for positions 1-3 */
function rankColor(rank: number): string {
  if (rank === 1) return 'text-accent-red font-extrabold';
  if (rank === 2) return 'text-accent font-bold';
  if (rank === 3) return 'text-amber-400 font-bold';
  return 'text-text-muted font-semibold';
}

export default function TrendingKeywords({ keywords }: TrendingKeywordsProps) {
  if (!keywords || keywords.length === 0) {
    return (
      <div className="rounded-card border border-border-muted bg-surface-card p-4">
        <h2 className="mb-3 text-body-md font-bold text-text">실시간 인기 검색어</h2>
        <p className="text-caption text-text-muted">데이터를 불러오는 중입니다.</p>
      </div>
    );
  }

  const top = keywords.slice(0, 10);

  return (
    <div className="rounded-card border border-border-muted bg-surface-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-muted px-4 py-3">
        <h2 className="text-body-md font-bold text-text">실시간 인기 검색어</h2>
        <span className="text-caption text-text-muted">검색 기준</span>
      </div>

      {/* List */}
      <ol className="divide-y divide-border-muted">
        {top.map((item, idx) => {
          const rank = idx + 1;
          return (
            <li key={item.keyword}>
              <Link
                href={`/search?q=${encodeURIComponent(item.keyword)}`}
                className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-elevated"
              >
                {/* Rank number */}
                <span
                  className={`w-5 text-right text-body-md leading-none tabular-nums ${rankColor(rank)}`}
                  aria-label={`${rank}위`}
                >
                  {rank}
                </span>

                {/* Keyword */}
                <span className="flex-1 truncate text-body-md text-text group-hover:text-accent transition-colors">
                  {item.keyword}
                </span>

                {/* Count pill */}
                {item.count > 0 && (
                  <span className="flex-none rounded-pill bg-surface-elevated px-2 py-0.5 text-caption tabular-nums text-text-secondary group-hover:bg-accent/15 group-hover:text-accent transition-colors">
                    {item.count.toLocaleString('ko-KR')}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
