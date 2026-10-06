export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import {
  getArticles,
  getBreakingNews,
  getCategoryCounts,
  getTrendingKeywords,
  groupByCategory,
} from '@/lib/queries';
import { categoryLabel, getCategoryStyle, cn } from '@/lib/utils';
import NewsCardLarge from '@/components/NewsCardLarge';
import NewsCard from '@/components/NewsCard';
import NewsCardCompact from '@/components/NewsCardCompact';
import BreakingTicker from '@/components/BreakingTicker';
import TrendingKeywords from '@/components/TrendingKeywords';
import NewsletterBanner from '@/components/NewsletterBanner';
import AdSlot from '@/components/AdSlot';
import { NEWSLETTER_ENABLED } from '@/lib/newsletter';

/** 30 visible slots + the 8 compact "latest" items that are no longer repeated below. */
const HOME_ARTICLE_COUNT = 40;
const COMPACT_LIST_SIZE = 8;

export default async function HomePage() {
  // getArticles throws on a DB error → error.tsx; the decorative helpers degrade to [].
  const [articles, breaking, catCounts, trendingKw] = await Promise.all([
    getArticles('all', HOME_ARTICLE_COUNT),
    getBreakingNews(),
    getCategoryCounts(),
    getTrendingKeywords(),
  ]);

  // Each article is placed exactly once: hero → sub-heroes → compact list → category / latest grids.
  const hero = articles[0];
  const subHeroes = articles.slice(1, 3);
  const listItems = articles.slice(3, 3 + COMPACT_LIST_SIZE);
  const remaining = articles.slice(3 + listItems.length);

  // Group remaining articles by category for editorial sections
  const grouped = groupByCategory(remaining);
  const topCatSlugs = catCounts
    .sort((a, b) => b.count - a.count)
    .map((c) => c.category)
    .filter((cat): cat is string => !!cat && !!grouped[cat] && grouped[cat].length >= 2)
    .slice(0, 3);

  const usedIds = new Set<number>();
  const categorySections = topCatSlugs.map((slug) => {
    const catArticles = grouped[slug] || [];
    const featured = catArticles[0];
    const secondary = catArticles.slice(1, 4);
    for (const a of [featured, ...secondary]) if (a) usedIds.add(a.id);
    return { slug, label: categoryLabel(slug), featured, secondary };
  });

  const latestNews = remaining.filter((a) => !usedIds.has(a.id));

  return (
    <>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <h1 className="sr-only">LiveNews 주요 뉴스</h1>
        {/* Breaking Ticker — inside container, aligned with content */}
        {breaking.length > 0 && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <BreakingTicker
              articles={breaking.map((a) => ({
                id: String(a.id),
                titleKo: a.titleKo,
                titleOriginal: a.titleOriginal,
                language: a.language,
              }))}
            />
          </div>
        )}
        {/* ── Hero Section ── */}
        {hero && (
          <section className="animate-fade-in">
            <h2 className="text-headline-md text-text mb-5 flex items-center gap-2">
              <span className="w-1 h-6 bg-accent rounded-full" />
              주요 헤드라인
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Main hero + breaking list below */}
              <div className="lg:col-span-2 flex flex-col gap-5">
                <NewsCardLarge article={hero} />

                {/* Latest headlines below hero (articles 4–11) — these are not repeated
                    in the category / latest grids further down. */}
                {listItems.length > 0 && (
                  <div className="bg-surface-card rounded-card border border-border-muted p-4 flex-1">
                    <h3 className="text-headline-sm text-text mb-3">
                      최신 뉴스
                    </h3>
                    <div className="space-y-0">
                      {listItems.map((article, idx) => (
                        <NewsCardCompact key={article.id} article={article} rank={idx + 1} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-hero stack */}
              {subHeroes.length > 0 && (
                <div className="flex flex-col gap-5">
                  {subHeroes.map((article) => (
                    <NewsCardLarge key={article.id} article={article} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Category Sections ── */}
        {categorySections.length > 0 && (
          <section className="mt-10 animate-fade-in">
            <h2 className="text-headline-md text-text mb-5 flex items-center gap-2">
              <span className="w-1 h-6 bg-accent-blue rounded-full" />
              카테고리별 뉴스
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categorySections.map(({ slug, label, featured, secondary }) => {
                const style = getCategoryStyle(slug);
                return (
                  <div
                    key={slug}
                    className="bg-surface-card rounded-card border border-border-muted p-4"
                  >
                    <Link
                      href={`/category/${slug}`}
                      className={cn(
                        'inline-flex items-center gap-1.5 mb-3 text-headline-sm transition-colors hover:underline',
                        style.text
                      )}
                    >
                      {label}
                      <svg
                        className="w-3.5 h-3.5 opacity-60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>

                    {featured && (
                      <div className="mb-3">
                        <NewsCard article={featured} />
                      </div>
                    )}

                    {secondary.length > 0 && (
                      <div className="mt-1">
                        {secondary.map((article, idx) => (
                          <NewsCardCompact key={article.id} article={article} rank={idx + 1} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Trending Keywords — full-width below categories */}
            {trendingKw.length > 0 && (
              <div className="mt-5 max-w-md">
                <TrendingKeywords keywords={trendingKw} />
              </div>
            )}
          </section>
        )}

        {/* ── Latest News ── */}
        {latestNews.length > 0 && (
          <section className="mt-10 animate-fade-in">
            <h2 className="text-headline-md text-text mb-5 flex items-center gap-2">
              <span className="w-1 h-6 bg-accent-green rounded-full" />
              최신 뉴스
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {latestNews.map((article, idx) => (
                <React.Fragment key={article.id}>
                  <NewsCard article={article} />
                  {(idx + 1) % 4 === 0 && idx < latestNews.length - 1 && (
                    <AdSlot size="native" className="md:col-span-2 lg:col-span-3" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </section>
        )}

        {/* ── Newsletter Banner — bottom of the feed so it doesn't interrupt reading ── */}
        {NEWSLETTER_ENABLED && articles.length > 0 && (
          <section className="mt-12 animate-fade-in">
            <NewsletterBanner />
          </section>
        )}

        {/* ── Empty State — the query succeeded and there is genuinely nothing yet ── */}
        {articles.length === 0 && (
          <div className="text-center py-24">
            <svg
              aria-hidden="true"
              className="w-16 h-16 mx-auto mb-4 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2"
              />
            </svg>
            <p className="text-headline-sm text-text-secondary">아직 표시할 뉴스가 없습니다</p>
            <p className="text-body-md text-text-muted mt-2">새 기사가 수집되면 이곳에 표시됩니다</p>
          </div>
        )}
      </div>
    </>
  );
}
