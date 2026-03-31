export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { getCached } from '@/lib/redis';
import { COUNTRY_SUBCATEGORIES } from '@/lib/constants';
import NewsCard from '@/components/NewsCard';
import NewsCardLarge from '@/components/NewsCardLarge';
import Pagination from '@/components/Pagination';

export const metadata = {
  title: '일본 뉴스 - LiveNews',
  description: '일본 주요 뉴스를 실시간으로 확인하세요',
};

async function getArticles(page: number) {
  const take = 20;
  const skip = (page - 1) * take;

  return getCached(`japan:${page}`, 60, async () => {
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: { country: 'japan', isActive: true },
        include: { source: true },
        orderBy: { publishedAt: 'desc' },
        take,
        skip,
      }),
      prisma.article.count({ where: { country: 'japan', isActive: true } }),
    ]);
    return { articles, total, totalPages: Math.ceil(total / take) };
  });
}

export default async function JapanPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const { articles, total, totalPages } = await getArticles(page);
  const headlines = articles.slice(0, 3);
  const rest = articles.slice(3);
  const subcategories = COUNTRY_SUBCATEGORIES.japan;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">일본 뉴스</h1>
        <span className="text-sm text-gray-500">{total}개 기사</span>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {subcategories.map((sub) => (
          <span
            key={sub.slug}
            className="px-3 py-1.5 rounded-full text-sm border border-gray-300 text-gray-600 hover:border-primary hover:text-primary cursor-pointer whitespace-nowrap"
          >
            {sub.label}
          </span>
        ))}
      </div>

      {headlines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {headlines.map((article) => (
            <NewsCardLarge key={article.id} article={article} />
          ))}
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {rest.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p>일본 뉴스를 수집 중입니다</p>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/japan" />
    </div>
  );
}
