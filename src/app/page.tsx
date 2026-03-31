export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCached } from '@/lib/redis';
import { COUNTRIES, CATEGORIES } from '@/lib/constants';
import NewsCardLarge from '@/components/NewsCardLarge';
import NewsCard from '@/components/NewsCard';
import CountryTabs from '@/components/CountryTabs';
import SearchBar from '@/components/SearchBar';

async function getArticles(country?: string) {
  try {
    const where: Record<string, unknown> = { isActive: true };
    if (country && country !== 'all') where.country = country;

    return await getCached(`home:${country || 'all'}`, 60, () =>
      prisma.article.findMany({
        where,
        include: { source: true },
        orderBy: { publishedAt: 'desc' },
        take: 30,
      })
    );
  } catch {
    return [];
  }
}

async function getBreakingNews() {
  try {
    return await getCached('breaking', 60, () =>
      prisma.article.findMany({
        where: { isActive: true },
        include: { source: true },
        orderBy: { publishedAt: 'desc' },
        take: 10,
      })
    );
  } catch {
    return [];
  }
}

async function getCategoryCounts() {
  try {
    return await getCached('cat-counts', 120, async () => {
      const counts = await prisma.article.groupBy({
        by: ['categoryPrimary'],
        where: { isActive: true },
        _count: true,
      });
      return counts.map((c) => ({ category: c.categoryPrimary, count: c._count }));
    });
  } catch {
    return [];
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { country?: string };
}) {
  const country = searchParams.country || 'all';
  const [articles, breaking, catCounts] = await Promise.all([
    getArticles(country),
    getBreakingNews(),
    getCategoryCounts(),
  ]);

  const headlines = articles.slice(0, 3);
  const rest = articles.slice(3);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breaking News Ticker */}
      {breaking.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl py-2.5 px-4 mb-6 overflow-hidden">
          <div className="flex items-center gap-3">
            <span className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-lg flex-shrink-0 animate-pulse">
              LIVE
            </span>
            <div className="overflow-hidden">
              <div className="breaking-ticker flex gap-8 whitespace-nowrap">
                {breaking.map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.id}`}
                    className="text-sm text-gray-700 hover:text-accent font-medium"
                  >
                    {article.titleKo || article.titleOriginal}
                  </Link>
                ))}
                {breaking.map((article) => (
                  <Link
                    key={`dup-${article.id}`}
                    href={`/article/${article.id}`}
                    className="text-sm text-gray-700 hover:text-accent font-medium"
                  >
                    {article.titleKo || article.titleOriginal}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar placeholder="글로벌 뉴스 검색..." />
      </div>

      {/* Country Tabs */}
      <CountryTabs activeCountry={country} />

      {/* Top Headlines - 3 Column Grid (like reference design) */}
      {headlines.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
            주요 헤드라인
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {headlines.map((article) => (
              <NewsCardLarge key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Latest News - 3 Column Grid */}
      {rest.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-accent rounded-full"></span>
            최신 뉴스
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {articles.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" />
          </svg>
          <p className="text-xl font-medium">뉴스를 수집 중입니다</p>
          <p className="text-sm mt-2">잠시 후 다시 확인해주세요</p>
        </div>
      )}

      {/* Sidebar: Categories + Countries */}
      {articles.length > 0 && (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categories */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">카테고리</h3>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.slice(0, 12).map((cat) => {
                const count = catCounts.find((c) => c.category === cat.slug)?.count || 0;
                return (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200 hover:border-primary hover:shadow-sm text-sm transition-all"
                  >
                    <span className="font-medium text-gray-700">{cat.label}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Countries */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">국가별 뉴스</h3>
            <div className="grid grid-cols-2 gap-3">
              {COUNTRIES.filter((c) => c.code !== 'all').map((c) => (
                <Link
                  key={c.code}
                  href={`/${c.code === 'global' ? 'world' : c.code}`}
                  className="text-center py-5 rounded-xl bg-white border border-gray-200 hover:border-primary hover:shadow-sm text-sm font-medium transition-all"
                >
                  <span className="text-2xl block mb-1">
                    {c.code === 'global' ? '🌍' : c.code === 'us' ? '🇺🇸' : c.code === 'japan' ? '🇯🇵' : '🇨🇳'}
                  </span>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
