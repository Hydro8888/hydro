import { Fragment } from 'react';
import type { Article } from '@/lib/types';
import AdSlot from './AdSlot';
import NewsCard from './NewsCard';
import NewsCardLarge from './NewsCardLarge';

const HEADLINE_COUNT = 3;

interface ArticleListingProps {
  articles: Article[];
  /** Leave an ad position after every fourth card of the grid. */
  ads?: boolean;
}

// One page of a list (breaking, country, category): the first three articles as large cards, the
// rest in the card grid. Both grids share the columns and the gap, so the two read as one list.
// At md the first large card spans the row, which leaves no orphan in the two-column grid.
export default function ArticleListing({ articles, ads = false }: ArticleListingProps) {
  const headlines = articles.slice(0, HEADLINE_COUNT);
  const rest = articles.slice(HEADLINE_COUNT);

  return (
    <>
      {headlines.length > 0 && (
        <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {headlines.map((article) => (
            <div key={article.id} className="grid md:first:col-span-2 lg:first:col-span-1">
              <NewsCardLarge article={article} />
            </div>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((article, idx) => (
            <Fragment key={article.id}>
              <NewsCard article={article} />
              {ads && (idx + 1) % 4 === 0 && idx < rest.length - 1 && (
                <AdSlot size="native" className="md:col-span-2 lg:col-span-3" />
              )}
            </Fragment>
          ))}
        </div>
      )}
    </>
  );
}
