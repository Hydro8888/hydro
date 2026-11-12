export const dynamic = 'force-dynamic';

import { Fragment } from 'react';
import Link from 'next/link';
import {
  getArticles,
  getBreakingNews,
  getCategoryCounts,
  getTrendingKeywords,
  groupByCategory,
} from '@/lib/queries';
import { CONTAINER, PANEL } from '@/lib/ui';
import { categoryLabel, cn } from '@/lib/utils';
import NewsCardLarge from '@/components/NewsCardLarge';
import NewsCard from '@/components/NewsCard';
import NewsCardCompact from '@/components/NewsCardCompact';
import BreakingTicker from '@/components/BreakingTicker';
import TrendingKeywords from '@/components/TrendingKeywords';
import NewsletterBanner from '@/components/NewsletterBanner';
import AdSlot from '@/components/AdSlot';
import EmptyState from '@/components/EmptyState';
import { ChevronRightIcon } from '@/components/icons';
import { NEWSLETTER_ENABLED } from '@/lib/newsletter';

/** 30 visible slots + the 8 compact "latest" items that are no longer repeated below. */
const HOME_ARTICLE_COUNT = 40;
const COMPACT_LIST_SIZE = 8;

const SECTION_TITLE = 'mb-4 text-headline-md text-text';

const wireMs = (d: Date | string | null | undefined): number => {
  const t = d ? new Date(d).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
};

/**
 * A wire list prints the publication time in its left column, so its rows run newest first by
 * that time (the queries order by collection time). Only the order inside one list changes;
 * which article lands in which block of the page does not (UNSLOP-AUDIT §7-11).
 */
function byWireTime<T extends { id: number; publishedAt: Date | string | null }>(list: T[]): T[] {
  return [...list].sort((a, b) => wireMs(b.publishedAt) - wireMs(a.publishedAt) || b.id - a.id);
}

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
    <div className={cn(CONTAINER, 'py-8')}>
      <h1 className="sr-only">LiveNews 주요 뉴스</h1>

      {/* The ticker band draws its own hairlines edge to edge of the container. */}
      {breaking.length > 0 && (
        <div className="mb-8">
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

      {/* ── Headlines: the lead story and the wire list on the left, two more stories on the right ── */}
      {hero && (
        <section>
          <h2 className={SECTION_TITLE}>주요 헤드라인</h2>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="flex flex-col gap-5 lg:col-span-2">
              <NewsCardLarge article={hero} priority lead />

              {/* Articles 4–11. They are not repeated in the category / remaining grids further down.
                  The rows hang 8px outside their own box, hence the 20px panel padding. */}
              {listItems.length > 0 && (
                <div className={cn(PANEL, 'flex-1 p-5')}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <h3 className="text-headline-sm text-text">최신 뉴스</h3>
                    {/* Unit of the time column */}
                    <span className="dateline">KST</span>
                  </div>
                  {byWireTime(listItems).map((article) => (
                    <NewsCardCompact key={article.id} article={article} />
                  ))}
                </div>
              )}
            </div>

            {/* Two rows of equal height, so the column ends level with the left one at lg. */}
            {subHeroes.length > 0 && (
              <div className={subHeroes.length > 1 ? 'grid gap-5 lg:grid-rows-2' : 'grid gap-5'}>
                {subHeroes.map((article) => (
                  <NewsCardLarge key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Category columns: a hairline and the section name, like the head of a newspaper column ── */}
      {categorySections.length > 0 && (
        <section className="mt-12">
          <h2 className={SECTION_TITLE}>카테고리별 뉴스</h2>

          <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {categorySections.map(({ slug, label, featured, secondary }) => (
              <div key={slug} className="border-t border-border pt-4">
                <Link
                  href={`/category/${slug}`}
                  className="mb-4 inline-flex items-center gap-2 text-headline-sm text-text transition-colors hover:text-text-secondary"
                >
                  {label}
                  <span className="text-text-muted">
                    <ChevronRightIcon />
                  </span>
                </Link>

                {featured && <NewsCard article={featured} />}

                {/* px-2 takes back the 8px the rows hang out, so their hairlines end on the column edges. */}
                {secondary.length > 0 && (
                  <div className="mt-2 px-2">
                    {byWireTime(secondary).map((article) => (
                      <NewsCardCompact key={article.id} article={article} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Article count per category — the index of this section, in the same grid. */}
            {trendingKw.length > 0 && <TrendingKeywords keywords={trendingKw} />}
          </div>
        </section>
      )}

      {/* ── Everything not placed above ── */}
      {latestNews.length > 0 && (
        <section className="mt-12">
          <h2 className={SECTION_TITLE}>그 밖의 뉴스</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {latestNews.map((article, idx) => (
              <Fragment key={article.id}>
                <NewsCard article={article} />
                {(idx + 1) % 4 === 0 && idx < latestNews.length - 1 && (
                  <AdSlot size="native" className="md:col-span-2 lg:col-span-3" />
                )}
              </Fragment>
            ))}
          </div>
        </section>
      )}

      {/* ── Newsletter — bottom of the feed so it doesn't interrupt reading ── */}
      {NEWSLETTER_ENABLED && articles.length > 0 && (
        <section className="mt-12">
          <NewsletterBanner />
        </section>
      )}

      {/* ── The query succeeded and there is genuinely nothing yet ── */}
      {articles.length === 0 && (
        <EmptyState title="아직 표시할 뉴스가 없습니다" detail="새 기사가 수집되면 이곳에 표시됩니다" />
      )}
    </div>
  );
}
