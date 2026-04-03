export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { COUNTRIES, CATEGORIES } from '@/lib/constants';
import { getArticles, getBreakingNews, getCategoryCounts } from '@/lib/queries';
import NewsCardLarge from '@/components/NewsCardLarge';
import NewsCard from '@/components/NewsCard';
import CountryTabs from '@/components/CountryTabs';
import SearchBar from '@/components/SearchBar';

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

  const hero = articles[0];
  const subHero = articles.slice(1, 3);
  const rest = articles.slice(3);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
      {/* Breaking News Ticker */}
      {breaking.length > 0 && (
        <div className="bg-accent-red/8 border border-accent-red/20 rounded-card py-2.5 px-4 mb-6 overflow-hidden">
          <div className="flex items-center gap-3">
            <span className="bg-accent-red text-white text-overline font-bold px-3 py-1 rounded-badge flex-shrink-0 animate-pulse-dot">
              LIVE
            </span>
            <div className="overflow-hidden">
              <div className="breaking-ticker flex gap-8 whitespace-nowrap">
                {breaking.map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.id}`}
                    className="text-body-md text-text-secondary hover:text-accent transition-colors font-medium"
                  >
                    {article.titleKo || article.titleOriginal}
                  </Link>
                ))}
                {breaking.map((article) => (
                  <Link
                    key={`dup-${article.id}`}
                    href={`/article/${article.id}`}
                    className="text-body-md text-text-secondary hover:text-accent transition-colors font-medium"
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

      {/* Hero Section: full-width top article + 2 sub-hero */}
      {hero && (
        <section className="mt-6">
          <h2 className="text-headline-md text-text mb-5 flex items-center gap-2">
            <span className="w-1 h-6 bg-accent rounded-full" />
            주요 헤드라인
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Hero — spans 2 cols on large */}
            <div className="lg:col-span-2">
              <NewsCardLarge key={hero.id} article={hero} />
            </div>

            {/* Sub-hero stack */}
            {subHero.length > 0 && (
              <div className="flex flex-col gap-5">
                {subHero.map((article) => (
                  <NewsCardLarge key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Latest News Grid */}
      {rest.length > 0 && (
        <section className="mt-10">
          <h2 className="text-headline-md text-text mb-5 flex items-center gap-2">
            <span className="w-1 h-6 bg-accent-blue rounded-full" />
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
        <div className="text-center py-24">
          <svg className="w-16 h-16 mx-auto mb-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" />
          </svg>
          <p className="text-headline-sm text-text-secondary">뉴스를 수집 중입니다</p>
          <p className="text-body-md text-text-muted mt-2">잠시 후 다시 확인해주세요</p>
        </div>
      )}

      {/* Bottom: Categories + Countries */}
      {articles.length > 0 && (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categories */}
          <div className="bg-surface-card rounded-card p-6 border border-border-muted">
            <h3 className="text-headline-sm text-text mb-4">카테고리</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.slice(0, 12).map((cat) => {
                const count = catCounts.find((c) => c.category === cat.slug)?.count || 0;
                return (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="flex items-center justify-between p-3 rounded-card bg-surface-elevated border border-border hover:border-accent hover:shadow-card text-body-md transition-all"
                  >
                    <span className="font-medium text-text">{cat.label}</span>
                    <span className="text-caption text-text-muted bg-surface px-2 py-0.5 rounded-pill">{count}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Countries */}
          <div className="bg-surface-card rounded-card p-6 border border-border-muted">
            <h3 className="text-headline-sm text-text mb-4">국가별 뉴스</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {COUNTRIES.filter((c) => c.code !== 'all').map((c) => (
                <Link
                  key={c.code}
                  href={`/${c.code === 'global' ? 'world' : c.code}`}
                  className="text-center py-5 rounded-card bg-surface-elevated border border-border hover:border-accent hover:shadow-card text-body-md font-medium text-text transition-all"
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
