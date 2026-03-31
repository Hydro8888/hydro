export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { formatDate, countryLabel, categoryLabel, countryColor } from '@/lib/utils';
import NewsCard from '@/components/NewsCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({
    where: { id: parseInt(params.id) },
  });
  if (!article) return { title: 'Not Found - LiveNews' };
  return {
    title: `${article.titleKo || article.titleOriginal} - LiveNews`,
    description: article.summaryKo || article.titleOriginal,
  };
}

async function getArticle(id: number) {
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: { source: true },
    });
    if (!article) return null;

    // Increment view count (fire-and-forget)
    prisma.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return article;
  } catch {
    return null;
  }
}

async function getRelatedArticles(article: { id: number; categoryPrimary: string | null; country: string }) {
  try {
    return await prisma.article.findMany({
    where: {
      isActive: true,
      id: { not: article.id },
      OR: [
        { categoryPrimary: article.categoryPrimary || undefined },
        { country: article.country },
      ],
    },
    include: { source: true },
    orderBy: { publishedAt: 'desc' },
    take: 5,
  });
  } catch {
    return [];
  }
}

export default async function ArticleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const article = await getArticle(id);
  if (!article) notFound();

  const related = await getRelatedArticles(article);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-primary">홈</Link>
        <span>/</span>
        {article.country && (
          <>
            <Link
              href={`/${article.country === 'global' ? 'world' : article.country}`}
              className="hover:text-primary"
            >
              {countryLabel(article.country)}
            </Link>
            <span>/</span>
          </>
        )}
        {article.categoryPrimary && (
          <Link href={`/category/${article.categoryPrimary}`} className="hover:text-primary">
            {categoryLabel(article.categoryPrimary)}
          </Link>
        )}
      </nav>

      {/* Article Header */}
      <article>
        {/* Korean Title */}
        <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
          {article.titleKo || article.titleOriginal}
        </h1>

        {/* Original Title (if different) */}
        {article.titleKo && article.titleKo !== article.titleOriginal && (
          <p className="text-gray-500 text-base mb-4 italic">
            {article.titleOriginal}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
          <span className="font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded">
            {article.source.sourceName}
          </span>
          <span className={`country-badge ${countryColor(article.country)}`}>
            {countryLabel(article.country)}
          </span>
          {article.categoryPrimary && (
            <span className="category-pill bg-blue-100 text-blue-800">
              {categoryLabel(article.categoryPrimary)}
            </span>
          )}
          <span className="text-gray-400">
            {formatDate(article.publishedAt)}
          </span>
          {article.author && (
            <span className="text-gray-500">{article.author}</span>
          )}
        </div>

        {/* Image */}
        {article.imageUrl && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.titleKo || article.titleOriginal}
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        )}

        {/* Korean Summary */}
        {article.summaryKo && (
          <div className="bg-blue-50 border-l-4 border-primary p-4 mb-6 rounded-r-lg">
            <h2 className="text-sm font-bold text-primary mb-2">한국어 요약</h2>
            <p className="text-gray-800 leading-relaxed">{article.summaryKo}</p>
          </div>
        )}

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Read Original Button */}
        <div className="flex gap-3 mb-8">
          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            원문 보러가기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            목록으로
          </Link>
        </div>
      </article>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="border-t border-gray-200 pt-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            관련 기사
          </h2>
          <div className="divide-y divide-gray-100">
            {related.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
