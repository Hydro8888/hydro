export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { getCached } from '@/lib/redis';
import { COUNTRY_SUBCATEGORIES } from '@/lib/constants';
import NewsCard from '@/components/NewsCard';
import NewsCardLarge from '@/components/NewsCardLarge';
import Pagination from '@/components/Pagination';
import Link from 'next/link';

export const metadata = {
  title: '세계 뉴스 - LiveNews',
  description: '전 세계 주요 뉴스를 실시간으로 확인하세요',
};

async function getArticles(page: number) {
  const take = 20;
  const skip = (page - 1) * take;

  try {
    return await getCached(`world:${page}`, 60, async () => {
      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where: { country: 'global', isActive: true },
          include: { source: true },
          orderBy: { publishedAt: 'desc' },
          take,
          skip,
        }),
        prisma.article.count({ where: { country: 'global', isActive: true } }),
      ]);
      return { articles, total, totalPages: Math.ceil(total / take) };
    });
  } catch {
    return { articles: [], total: 0, totalPages: 0 };
  }
}

export default async function WorldPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const { articles, total, totalPages } = await getArticles(page);
  const headlines = articles.slice(0, 3);
  const rest = articles.slice(3);
  const subcategories = COUNTRY_SUBCATEGORIES.global;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">세계 뉴스</h1>
        <span className="text-sm text-gray-500">{total}개 기사</span>
      </div>

      {/* Subcategory tabs */}
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

      {/* Headlines */}
      {headlines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {headlines.map((article) => (
            <NewsCardLarge key={article.id} article={article} />
          ))}
        </div>
      )}

      {/* Article List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rest.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p>세계 뉴스를 수집 중입니다</p>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/world" />
    </div>
  );
}
