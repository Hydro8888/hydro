import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';
import type { TrendingKeyword } from '@/lib/types';
import { NUM, PANEL } from '@/lib/ui';
import { categoryLabel, formatCount } from '@/lib/utils';

interface TrendingKeywordsProps {
  keywords: TrendingKeyword[];
}

const TITLE = '카테고리별 기사 수';
const CATEGORY_SLUGS: ReadonlySet<string> = new Set(CATEGORIES.map((c) => c.slug));
const FIGURE = `text-meta text-text-muted ${NUM}`;

/**
 * Article count per category, largest first. The data (getTrendingKeywords) is a count of stored
 * articles per category slug, not search terms: a slug is shown by its Korean name and links to
 * its category page. Any other keyword keeps its own text and the search link.
 */
export default function TrendingKeywords({ keywords }: TrendingKeywordsProps) {
  if (!keywords || keywords.length === 0) {
    return (
      <div className={`${PANEL} p-5`}>
        <h2 className="text-headline-sm text-text">{TITLE}</h2>
        <p className="mt-2 text-caption text-text-muted">아직 집계된 기사가 없습니다</p>
      </div>
    );
  }

  const top = keywords.slice(0, 10);

  return (
    <div className={`${PANEL} overflow-hidden`}>
      <div className="border-b border-border-muted px-5 py-4">
        <h2 className="text-headline-sm text-text">{TITLE}</h2>
      </div>

      <ol className="divide-y divide-border-muted">
        {top.map((item, idx) => {
          const rank = idx + 1;
          const isCategory = CATEGORY_SLUGS.has(item.keyword);
          return (
            <li key={item.keyword}>
              <Link
                href={isCategory ? `/category/${item.keyword}` : `/search?q=${encodeURIComponent(item.keyword)}`}
                className="flex h-10 items-center gap-3 px-5 transition-colors hover:bg-surface-elevated focus-visible:-outline-offset-2"
              >
                <span className={`w-6 ${FIGURE}`} aria-label={`${rank}위`}>
                  {rank}
                </span>
                <span className="flex-1 truncate text-body-md text-text">{isCategory ? categoryLabel(item.keyword) : item.keyword}</span>
                {item.count > 0 && <span className={`flex-none ${FIGURE}`}>{formatCount(item.count)}</span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
