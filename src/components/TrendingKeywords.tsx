import Link from 'next/link';

interface TrendingKeyword {
  keyword: string;
  count: number;
}

interface TrendingKeywordsProps {
  keywords: TrendingKeyword[];
}

/** Rank-based color classes for positions 1-3 */
function rankColor(rank: number): string {
  if (rank === 1) return 'text-red-500 font-extrabold';
  if (rank === 2) return 'text-orange-500 font-bold';
  if (rank === 3) return 'text-yellow-500 font-bold';
  return 'text-gray-400 font-semibold';
}

export default function TrendingKeywords({ keywords }: TrendingKeywordsProps) {
  if (!keywords || keywords.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-gray-900">실시간 인기 검색어</h2>
        <p className="text-xs text-gray-400">데이터를 불러오는 중입니다.</p>
      </div>
    );
  }

  const top = keywords.slice(0, 10);

  return (
    <div className="rounded-xl border border-gray-100 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-bold text-gray-900">실시간 인기 검색어</h2>
        <span className="text-xs text-gray-400">검색 기준</span>
      </div>

      {/* List */}
      <ol className="divide-y divide-gray-50">
        {top.map((item, idx) => {
          const rank = idx + 1;
          return (
            <li key={item.keyword}>
              <Link
                href={`/search?q=${encodeURIComponent(item.keyword)}`}
                className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-blue-50"
              >
                {/* Rank number */}
                <span
                  className={`w-5 text-right text-sm leading-none tabular-nums ${rankColor(rank)}`}
                  aria-label={`${rank}위`}
                >
                  {rank}
                </span>

                {/* Keyword */}
                <span className="flex-1 truncate text-sm text-gray-800 group-hover:text-blue-600 transition-colors">
                  {item.keyword}
                </span>

                {/* Count pill */}
                {item.count > 0 && (
                  <span className="flex-none rounded-full bg-gray-100 px-2 py-0.5 text-xs tabular-nums text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
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
