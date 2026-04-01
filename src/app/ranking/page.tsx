export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { getCached } from '@/lib/redis';
import NewsCard from '@/components/NewsCard';
import CountryTabs from '@/components/CountryTabs';

export const metadata = {
  title: '랭킹 - LiveNews',
  description: '가장 많이 본 뉴스 랭킹',
};

async function getRankingArticles(country: string) {
  const where: Record<string, unknown> = { isActive: true };
  if (country && country !== 'all') where.country = country;

  try {
    return await getCached(`ranking:${country}`, 120, () =>
      prisma.article.findMany({
        where,
        include: { source: true },
        orderBy: { viewCount: 'desc' },
        take: 30,
      })
    );
  } catch {
    return [];
  }
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: { country?: string };
}) {
  const country = searchParams.country || 'all';
  const articles = await getRankingArticles(country);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">뉴스 랭킹</h1>

      <CountryTabs activeCountry={country} />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p>랭킹 데이터가 없습니다</p>
        </div>
      )}
    </div>
  );
}
