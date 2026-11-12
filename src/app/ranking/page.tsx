export const dynamic = 'force-dynamic';

import { getRankingArticles } from '@/lib/queries';
import { normalizeRankingCountry } from '@/lib/routing';
import { CONTAINER, NUM } from '@/lib/ui';
import { cn } from '@/lib/utils';
import NewsCard from '@/components/NewsCard';
import CountryTabs from '@/components/CountryTabs';
import EmptyState from '@/components/EmptyState';
import PageHeading from '@/components/PageHeading';

export const metadata = {
  title: '랭킹',
  description: '가장 많이 본 뉴스 랭킹',
};

export default async function RankingPage({
  searchParams,
}: {
  searchParams: { country?: string | string[] };
}) {
  // Unknown ?country= values fall back to 'all' (no empty page, no arbitrary cache keys)
  const country = normalizeRankingCountry(searchParams.country);
  // Throws on a DB error → error boundary
  const articles = await getRankingArticles(country);

  return (
    <div className={cn(CONTAINER, 'py-8')}>
      <PageHeading title="뉴스 랭킹" />

      <CountryTabs activeCountry={country} basePath="/ranking?country=[country]" />

      {/* Every rank is printed, above its card (nothing sits on the photo). The top three are in
          the text color, the rest muted. */}
      {articles.length > 0 && (
        <ol className="mt-8 grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, idx) => (
            <li key={article.id} className="flex flex-col">
              <p className={cn('mb-2 text-headline-sm', NUM, idx < 3 ? 'text-text' : 'text-text-muted')}>
                {idx + 1}
                <span className="sr-only">위</span>
              </p>
              <div className="grid flex-1">
                <NewsCard article={article} />
              </div>
            </li>
          ))}
        </ol>
      )}

      {articles.length === 0 && (
        <EmptyState title="아직 랭킹 데이터가 없습니다" detail="기사 조회가 쌓이면 이곳에 순위가 표시됩니다" />
      )}
    </div>
  );
}
