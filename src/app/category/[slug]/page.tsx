export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CATEGORIES } from '@/lib/constants';
import { BTN_SECONDARY, CONTAINER } from '@/lib/ui';
import { categoryLabel, cn, parsePage } from '@/lib/utils';
import { getCategoryArticles } from '@/lib/queries';
import { isKnownCategorySlug, pageHref, resolvePageRequest } from '@/lib/routing';
import ArticleListing from '@/components/ArticleListing';
import ChipNav from '@/components/ChipNav';
import EmptyState from '@/components/EmptyState';
import PageHeading from '@/components/PageHeading';
import Pagination from '@/components/Pagination';

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

  return (
    <div className={cn(CONTAINER, 'py-8')}>
      <PageHeading title={`${label} 뉴스`} count={total} />

      <ChipNav label="카테고리" items={CATEGORIES} current={params.slug} />

      <ArticleListing articles={articles} ads />

      {/* The query succeeded and there is genuinely nothing yet */}
      {articles.length === 0 && (
        <EmptyState title={`${label} 분야 기사가 아직 없습니다`} detail="새 기사가 수집되면 이곳에 표시됩니다">
          <Link href="/breaking" className={BTN_SECONDARY}>
            전체 속보 보기
          </Link>
        </EmptyState>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath={`/category/${params.slug}`} />
    </div>
  );
}
