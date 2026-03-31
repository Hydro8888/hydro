export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCached } from '@/lib/redis';
import { timeAgo, countryLabel, countryColor, categoryLabel } from '@/lib/utils';
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

  const headlines = articles.slice(0, 5);
  const rest = articles.slice(5);

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Breaking News Ticker */}
      {breaking.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 py-2 px-4 mb-4 overflow-hidden">
          <div className="flex items-center gap-3">
            <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded flex-shrink-0">
              속보
            </span>
            <div className="overflow-hidden">
              <div className="breaking-ticker flex gap-8 whitespace-nowrap">
                {breaking.map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.id}`}
                    className="text-sm text-gray-800 hover:text-accent"
                  >
                    {article.titleKo || article.titleOriginal}
                  </Link>
                ))}
                {breaking.map((article) => (
                  <Link
                    key={`dup-${article.id}`}
                    href={`/article/${article.id}`}
                    className="text-sm text-gray-800 hover:text-accent"
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
      <div className="my-6">
        <SearchBar placeholder="글로벌 뉴스 검색..." />
      </div>

      {/* Country Tabs */}
      <CountryTabs activeCountry={country} />

      {/* Headlines Section */}
      <section className="mt-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-primary rounded-full"></span>
          주요 헤드라인
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {headlines.map((article) => (
            <NewsCardLarge key={article.id} article={article} />
          ))}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Articles List */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-accent rounded-full"></span>
            최신 뉴스
          </h2>
          <div className="divide-y divide-gray-100">
            {rest.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
          {articles.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">뉴스를 수집 중입니다</p>
              <p className="text-sm mt-2">잠시 후 다시 확인해주세요</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Categories */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold mb-3">카테고리</h3>
            <div className="space-y-2">
              {CATEGORIES.slice(0, 12).map((cat) => {
                const count = catCounts.find((c) => c.category === cat.slug)?.count || 0;
                return (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="flex items-center justify-between py-1 text-sm text-gray-700 hover:text-primary"
                  >
                    <span>{cat.label}</span>
                    <span className="text-xs text-gray-400">{count}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Country Quick Links */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold mb-3">국가별 뉴스</h3>
            <div className="grid grid-cols-2 gap-2">
              {COUNTRIES.filter((c) => c.code !== 'all').map((c) => (
                <Link
                  key={c.code}
                  href={`/${c.code === 'global' ? 'world' : c.code}`}
                  className="text-center py-3 rounded-lg border border-gray-200 hover:border-primary hover:text-primary text-sm font-medium transition-colors"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
