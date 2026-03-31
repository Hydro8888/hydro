export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { getCached } from '@/lib/redis';
import NewsCard from '@/components/NewsCard';
import Pagination from '@/components/Pagination';

export const metadata = {
  title: '속보 - LiveNews',
  description: '최신 속보 뉴스를 실시간으로 확인하세요',
};

async function getBreakingArticles(page: number) {
  const take = 30;
  const skip = (page - 1) * take;

  try {
    return await getCached(`breaking:${page}`, 30, async () => {
      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where: { isActive: true },
          include: { source: true },
          orderBy: { publishedAt: 'desc' },
          take,
          skip,
        }),
        prisma.article.count({ where: { isActive: true } }),
      ]);
      return { articles, total, totalPages: Math.ceil(total / take) };
    });
  } catch {
    return { articles: [], total: 0, totalPages: 0 };
  }
}

export default async function BreakingPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const { articles, total, totalPages } = await getBreakingArticles(page);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="bg-accent text-white text-sm font-bold px-3 py-1 rounded">속보</span>
        <h1 className="text-2xl font-bold">최신 뉴스</h1>
        <span className="text-sm text-gray-500">{total}개 기사</span>
      </div>

      <div className="divide-y divide-gray-100">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p>뉴스를 수집 중입니다</p>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/breaking" />
    </div>
  );
}
