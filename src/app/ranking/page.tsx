export const dynamic = 'force-dynamic';

import { getRankingArticles } from '@/lib/queries';
import NewsCard from '@/components/NewsCard';
import CountryTabs from '@/components/CountryTabs';

export const metadata = {
  title: '랭킹 - LiveNews',
  description: '가장 많이 본 뉴스 랭킹',
};

export default async function RankingPage({
  searchParams,
}: {
  searchParams: { country?: string };
}) {
  const country = searchParams.country || 'all';
  const articles = await getRankingArticles(country);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8">
      <h1 className="text-headline-lg text-text mb-6">뉴스 랭킹</h1>

      <CountryTabs activeCountry={country} />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((article, idx) => (
          <div key={article.id} className="relative">
            {idx < 3 && (
              <div className="absolute -top-2 -left-2 z-10 w-7 h-7 rounded-full bg-accent text-white text-caption font-bold flex items-center justify-center shadow-elevated">
                {idx + 1}
              </div>
            )}
            <NewsCard article={article} />
          </div>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-24">
          <p className="text-text-muted text-body-lg">랭킹 데이터가 없습니다</p>
        </div>
      )}
    </div>
  );
}
