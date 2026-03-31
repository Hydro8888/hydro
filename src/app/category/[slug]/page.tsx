export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { getCached } from '@/lib/redis';
import { CATEGORIES } from '@/lib/constants';
import { categoryLabel } from '@/lib/utils';
import NewsCard from '@/components/NewsCard';
import Pagination from '@/components/Pagination';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const label = categoryLabel(params.slug);
  return {
    title: `${label} 뉴스 - LiveNews`,
    description: `${label} 관련 최신 글로벌 뉴스`,
  };
}

async function getArticles(slug: string, page: number) {
  const take = 20;
  const skip = (page - 1) * take;

  return getCached(`cat:${slug}:${page}`, 60, async () => {
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: { categoryPrimary: slug, isActive: true },
        include: { source: true },
        orderBy: { publishedAt: 'desc' },
        take,
        skip,
      }),
      prisma.article.count({ where: { categoryPrimary: slug, isActive: true } }),
    ]);
    return { articles, total, totalPages: Math.ceil(total / take) };
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const { articles, total, totalPages } = await getArticles(params.slug, page);
  const label = categoryLabel(params.slug);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{label} 뉴스</h1>
        <span className="text-sm text-gray-500">{total}개 기사</span>
      </div>

      {/* Category Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className={`px-3 py-1.5 rounded-full text-sm border whitespace-nowrap transition-colors ${
              cat.slug === params.slug
                ? 'bg-primary text-white border-primary'
                : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      <div className="divide-y divide-gray-100">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p>{label} 관련 뉴스가 없습니다</p>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath={`/category/${params.slug}`} />
    </div>
  );
}
