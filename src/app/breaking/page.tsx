export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getBreakingArticles } from '@/lib/queries';
import { CONTAINER } from '@/lib/ui';
import { cn, parsePage } from '@/lib/utils';
import { pageHref, resolvePageRequest } from '@/lib/routing';
import ArticleListing from '@/components/ArticleListing';
import EmptyState from '@/components/EmptyState';
import PageHeading from '@/components/PageHeading';
import Pagination from '@/components/Pagination';

export const metadata = {
  title: '속보',
  description: '해외 주요 언론의 최신 기사를 수집 순서대로 전합니다',
};

export default async function BreakingPage({
  searchParams,
}: {
  searchParams: { page?: string | string[] };
}) {
  const page = parsePage(searchParams.page);
  // Throws on a DB error → breaking/error boundary (never a fake "loading" empty state)
  const { articles, total, totalPages } = await getBreakingArticles(page);

  const resolved = resolvePageRequest(page, totalPages);
  if (resolved.kind === 'redirect') redirect(pageHref('/breaking', resolved.page));

  return (
    <div className={cn(CONTAINER, 'py-8')}>
      <PageHeading title="속보" count={total} />

      <ArticleListing articles={articles} />

      {articles.length === 0 && (
        <EmptyState title="아직 표시할 뉴스가 없습니다" detail="새 기사가 수집되면 이곳에 표시됩니다" />
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/breaking" />
    </div>
  );
}
