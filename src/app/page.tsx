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

/** Rows per column of the two-column wire list at lg, by the length of its first half (up to COMPACT_LIST_SIZE / 2). */
const WIRE_GRID_ROWS: Partial<Record<number, string>> = {
  1: 'lg:grid-rows-1',
  2: 'lg:grid-rows-2',
  3: 'lg:grid-rows-3',
  4: 'lg:grid-rows-4',
};

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

  // The wire list in publication order, split for its two columns at lg.
  const wireRows = byWireTime(listItems);
  const wireFirstHalf = wireRows.slice(0, Math.ceil(wireRows.length / 2));
  const wireSecondHalf = wireRows.slice(wireFirstHalf.length);
  const wireGridRows = WIRE_GRID_ROWS[wireFirstHalf.length];

  // Three category columns and the count panel make four cells: two by two from md, one row at xl.
  // With fewer cells the section keeps the three-column grid of the rest of the page.
  // The 32px between two lines of cells is each cell's own pb-8, and -mb-8 takes the last one back:
  // a row gap would also open in front of the empty fourth row the count panel spans (see below).
  const categoryCells = categorySections.length + (trendingKw.length > 0 ? 1 : 0);
  const categoryGrid =
    categoryCells === 4
      ? '-mb-8 grid grid-cols-1 gap-x-5 md:grid-cols-2 xl:grid-cols-4'
      : '-mb-8 grid grid-cols-1 gap-x-5 md:grid-cols-2 lg:grid-cols-3';

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

      {/* ── Headlines: the lead story and the wire list on the left, two more stories on the right.
             Both columns keep the height of their content (items-start): a stretched card would
             open an empty band between its summary and its meta line. ── */}
      {hero && (
        <section>
          <h2 className={SECTION_TITLE}>주요 헤드라인</h2>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
            <div className="flex flex-col gap-5 lg:col-span-2">
              <NewsCardLarge article={hero} priority lead />

              {/* Articles 4–11. They are not repeated in the category / remaining grids further down.
                  The rows hang 8px outside their own box, hence the 20px panel padding. */}
              {wireRows.length > 0 && (
                <div className={cn(PANEL, 'p-5')}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <h3 className="text-headline-sm text-text">최신 뉴스</h3>
                    {/* Unit of the time column */}
                    <span className="dateline">KST</span>
                  </div>
                  {/* One list, read down: a single column below lg, two columns of equal length from lg
                      (which also brings this column to about the height of the two cards beside it).
                      At lg the two halves dissolve (contents) and their rows share the grid's rows, so a
                      row is as tall on the left as on the right and the hairlines run level. */}
                  <div className={wireGridRows ? cn('lg:grid lg:grid-flow-col lg:auto-cols-fr lg:gap-x-8', wireGridRows) : undefined}>
                    {/* Below lg this half's bottom hairline is the divider before the next row; it is
                        drawn on the same box as the rows' own hairlines (-mx-2 px-2). */}
                    <div className={cn(wireSecondHalf.length > 0 && '-mx-2 border-b border-border-muted px-2', wireGridRows && 'lg:contents')}>
                      {wireFirstHalf.map((article) => (
                        <NewsCardCompact key={article.id} article={article} />
                      ))}
                    </div>
                    {wireSecondHalf.length > 0 && (
                      <div className={wireGridRows ? 'lg:contents' : undefined}>
                        {wireSecondHalf.map((article) => (
                          <NewsCardCompact key={article.id} article={article} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Side by side at md, stacked at lg */}
            {subHeroes.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1">
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

          {/* A column is three rows of this grid (name, card, wire rows): subgrid puts the three parts of
              neighbouring columns on the same row tracks, so cards side by side are equally tall and their
              meta lines and the lists below start level. Without subgrid a column keeps its own heights
              (content-start). */}
          <div className={categoryGrid}>
            {categorySections.map(({ slug, label, featured, secondary }) => (
              <div key={slug} className="row-span-3 grid grid-rows-subgrid content-start border-t border-border pb-8 pt-4">
                <Link
                  href={`/category/${slug}`}
                  className="mb-4 inline-flex items-center gap-2 justify-self-start text-headline-sm text-text transition-colors hover:text-text-secondary"
                >
                  {label}
                  <span className="text-text-muted">
                    <ChevronRightIcon />
                  </span>
                </Link>

                {/* The card fills its row, which is as tall as the tallest card beside it. */}
                {featured && (
                  <div className="grid">
                    <NewsCard article={featured} />
                  </div>
                )}

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

            {/* Article count per category — the index of this section, in the same grid. It spans the
                three rows of the columns beside it and one more that nothing else is in: when the panel
                is the taller one, that empty row takes the difference and the three rows keep the
                heights of their content. */}
            {trendingKw.length > 0 && (
              <div className="row-span-4 pb-8">
                <TrendingKeywords keywords={trendingKw} />
              </div>
            )}
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
