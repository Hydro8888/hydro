export const dynamic = 'force-dynamic';

import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { CATEGORIES } from '@/lib/constants';
import { categoryLabel, parsePage } from '@/lib/utils';
import { getCategoryArticles } from '@/lib/queries';
import { isKnownCategorySlug, pageHref, resolvePageRequest } from '@/lib/routing';
import NewsCard from '@/components/NewsCard';
import NewsCardLarge from '@/components/NewsCardLarge';
import Pagination from '@/components/Pagination';
import AdSlot from '@/components/AdSlot';
import Link from 'next/link';

// Unknown slugs get their 404 status from category/[slug]/layout.tsx; the notFound() here only
// makes Next resolve not-found.tsx's metadata for the RSC head (tab title after hydration).
export async function generateMetadata({ params }: { params: { slug: string } }) {
  if (!isKnownCategorySlug(params.slug)) notFound();
  const label = categoryLabel(params.slug);
  return {
    title: `${label} 뉴스`,
    description: `${label} 관련 최신 글로벌 뉴스`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string | string[] };
}) {
  const page = parsePage(searchParams.page);
  // Throws on a DB error → error boundary (never a fake empty state)
  const { articles, total, totalPages } = await getCategoryArticles(params.slug, page);

  const resolved = resolvePageRequest(page, totalPages);
  if (resolved.kind === 'redirect') redirect(pageHref(`/category/${params.slug}`, resolved.page));

  const label = categoryLabel(params.slug);
  const headlines = articles.slice(0, 3);
  const rest = articles.slice(3);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-headline-lg text-text">{label} 뉴스</h1>
        <span className="text-caption text-text-muted bg-surface-elevated px-2.5 py-1 rounded-badge">
          {total}개
        </span>
      </div>

      {/* Category Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const active = cat.slug === params.slug;
          return (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={`px-3.5 py-1.5 rounded-pill text-body-md border whitespace-nowrap transition-colors ${
                active
                  ? 'bg-accent text-white border-accent'
                  : 'border-border text-text-secondary hover:border-accent hover:text-accent'
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>

      {headlines.length > 0 && (
        <section className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {headlines.map((a) => (
              <NewsCardLarge key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((a, idx) => (
              <React.Fragment key={a.id}>
                <NewsCard article={a} />
                {(idx + 1) % 4 === 0 && idx < rest.length - 1 && (
                  <AdSlot size="native" className="md:col-span-2 lg:col-span-3" />
                )}
              </React.Fragment>
            ))}
          </div>
        </section>
      )}

      {/* Empty state — the query succeeded and there is genuinely nothing yet */}
      {articles.length === 0 && (
        <div className="text-center py-24">
          <p className="text-text-secondary text-headline-sm">{label} 분야 기사가 아직 없습니다</p>
          <p className="text-text-muted text-body-md mt-2">새 기사가 수집되면 이곳에 표시됩니다</p>
          <Link
            href="/breaking"
            className="mt-4 inline-block px-4 py-2 border border-border text-text-secondary rounded-card text-body-md hover:border-accent hover:text-accent transition-colors"
          >
            전체 속보 보기
          </Link>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath={`/category/${params.slug}`} />
    </div>
  );
}
