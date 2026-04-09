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

export default async function HomePage() {
  const [articles, breaking, catCounts, trendingKw] = await Promise.all([
    getArticles('all'),
    getBreakingNews(),
    getCategoryCounts(),
    getTrendingKeywords(),
  ]);

  const hero = articles[0];
  const subHeroes = articles.slice(1, 3);
  const remaining = articles.slice(3);

  // Group remaining articles by category for editorial sections
  const grouped = groupByCategory(remaining);
  const topCatSlugs = catCounts
    .sort((a, b) => b.count - a.count)
    .map((c) => c.category)
    .filter((cat): cat is string => !!cat && !!grouped[cat] && grouped[cat].length >= 2)
    .slice(0, 3);

  const usedIds = new Set<number | string>();
  const categorySections = topCatSlugs.map((slug) => {
    const catArticles = grouped[slug] || [];
    const featured = catArticles[0];
    const secondary = catArticles.slice(1, 4);
    [featured, ...secondary].forEach((a) => {
      if (a && 'id' in a) usedIds.add((a as any).id);
    });
    return { slug, label: categoryLabel(slug), featured, secondary };
  });

  const latestNews = remaining.filter((a) => !usedIds.has(a.id));

  return (
    <>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        {/* Breaking Ticker — inside container, aligned with content */}
        {breaking.length > 0 && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <BreakingTicker
              articles={breaking.map((a) => ({
                id: String(a.id),
                titleKo: a.titleKo,
                titleOriginal: a.titleOriginal,
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

                {/* Breaking + Latest news list — fills the gap below hero */}
                {(() => {
                  const heroIds = new Set([hero.id, ...subHeroes.map(a => a.id)]);
                  const breakingIds = new Set(breaking.map(a => a.id));
                  const fillArticles = articles
                    .filter(a => !heroIds.has(a.id) && !breakingIds.has(a.id))
                    .slice(0, 8 - breaking.length);
                  const listItems = [...breaking, ...fillArticles].slice(0, 8);
                  const hasExtraFill = fillArticles.length > 0;

                  if (listItems.length === 0) return null;
                  return (
                    <div className="bg-surface-card rounded-card border border-border-muted p-4 flex-1">
                      <h3 className="text-headline-sm text-text mb-3 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-accent-red animate-pulse-dot opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-red" />
                        </span>
                        {hasExtraFill ? '속보 · 최신' : '속보'}
                      </h3>
                      <div className="space-y-0">
                        {listItems.map((article, idx) => (
                          <NewsCardCompact key={article.id} article={article} rank={idx + 1} />
                        ))}
                      </div>
                    </div>
                  );
                })()}
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

        {/* ── Newsletter Banner ── */}
        <section className="mt-8 animate-fade-in">
          <NewsletterBanner />
        </section>

        {/* ── Category Sections ── */}
        {categorySections.length > 0 && (
          <section className="mt-10 animate-fade-in">
            <h2 className="text-headline-md text-text mb-5 flex items-center gap-2">
              <span className="w-1 h-6 bg-accent-blue rounded-full" />
              카테고리별 뉴스
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {categorySections.map(({ slug, label, featured, secondary }) => {
                const style = getCategoryStyle(slug);
                return (
                  <div
                    key={slug}
                    className="bg-surface-card rounded-card border border-border-muted p-4"
                  >
                    {/* Category heading */}
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

                    {/* Featured article — compact card with image */}
                    {featured && (
                      <div className="mb-3">
                        <NewsCard article={featured as any} />
                      </div>
                    )}

                    {/* Secondary articles — compact list */}
                    {secondary.length > 0 && (
                      <div className="mt-1">
                        {secondary.map((article, idx) => (
                          <NewsCardCompact
                            key={(article as any).id}
                            article={article as any}
                            rank={idx + 1}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Trending Keywords sidebar + Ad */}
              <div className="flex flex-col gap-5">
                <TrendingKeywords keywords={trendingKw} />
                <div className="hidden lg:block">
                  <AdSlot size="sidebar" />
                </div>
              </div>
            </div>
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

        {/* ── Empty State ── */}
        {articles.length === 0 && (
          <div className="text-center py-24">
            <svg
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
            <p className="text-headline-sm text-text-secondary">
              뉴스를 수집 중입니다
            </p>
            <p className="text-body-md text-text-muted mt-2">
              잠시 후 다시 확인해주세요
            </p>
          </div>
        )}
      </div>
    </>
  );
}
