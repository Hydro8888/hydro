export const dynamic = 'force-dynamic';

import { getBreakingArticles } from '@/lib/queries';
import NewsCard from '@/components/NewsCard';
import NewsCardLarge from '@/components/NewsCardLarge';
import Pagination from '@/components/Pagination';

export const metadata = {
  title: '속보 - LiveNews',
  description: '최신 속보 뉴스를 실시간으로 확인하세요',
};

export default async function BreakingPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const { articles, total, totalPages } = await getBreakingArticles(page);
  const headlines = articles.slice(0, 3);
  const rest = articles.slice(3);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <span className="bg-accent-red/15 text-accent-red text-overline font-bold px-3 py-1.5 rounded-badge border border-accent-red/30">속보</span>
        <h1 className="text-headline-lg text-text">최신 뉴스</h1>
        <span className="text-caption text-text-muted bg-surface-elevated px-2.5 py-1 rounded-badge">
          {total}개
        </span>
      </div>

      {headlines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {headlines.map((a) => (
            <NewsCardLarge key={a.id} article={a} />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((a) => (
            <NewsCard key={a.id} article={a} />
          ))}
        </div>
      )}

      {articles.length === 0 && (
        <div className="text-center py-24">
          <p className="text-text-muted text-body-lg">뉴스를 수집 중입니다</p>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/breaking" />
    </div>
  );
}
