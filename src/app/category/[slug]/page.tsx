export const dynamic = 'force-dynamic';

import { CATEGORIES } from '@/lib/constants';
import { categoryLabel, getCategoryStyle } from '@/lib/utils';
import { getCategoryArticles } from '@/lib/queries';
import NewsCard from '@/components/NewsCard';
import NewsCardLarge from '@/components/NewsCardLarge';
import Pagination from '@/components/Pagination';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const label = categoryLabel(params.slug);
  return {
    title: `${label} 뉴스 - LiveNews`,
    description: `${label} 관련 최신 글로벌 뉴스`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const { articles, total, totalPages } = await getCategoryArticles(params.slug, page);
  const label = categoryLabel(params.slug);
  const style = getCategoryStyle(params.slug);
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
            {rest.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {articles.length === 0 && (
        <div className="text-center py-24">
          <p className="text-text-muted text-body-lg">{label} 관련 뉴스가 없습니다</p>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath={`/category/${params.slug}`} />
    </div>
  );
}
