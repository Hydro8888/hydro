export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { formatDate, countryLabel, categoryLabel, timeAgo, getDefaultImage } from '@/lib/utils';
import NewsCard from '@/components/NewsCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const categoryColors: Record<string, string> = {
  politics: 'bg-red-600', economy: 'bg-blue-600', market: 'bg-indigo-600',
  business: 'bg-purple-600', 'ai-tech': 'bg-cyan-600', semiconductor: 'bg-teal-600',
  automotive: 'bg-orange-600', energy: 'bg-yellow-600', society: 'bg-gray-600',
  culture: 'bg-pink-600', entertainment: 'bg-fuchsia-600', sports: 'bg-green-600',
  science: 'bg-violet-600', health: 'bg-rose-600', world: 'bg-emerald-600',
  general: 'bg-slate-600',
};

const categoryGradients: Record<string, string> = {
  politics: 'from-red-500 to-rose-700',
  economy: 'from-blue-500 to-indigo-700',
  market: 'from-indigo-500 to-purple-700',
  business: 'from-purple-500 to-violet-700',
  'ai-tech': 'from-cyan-500 to-blue-700',
  semiconductor: 'from-teal-500 to-emerald-700',
  automotive: 'from-orange-500 to-red-700',
  energy: 'from-yellow-500 to-orange-700',
  society: 'from-gray-500 to-slate-700',
  culture: 'from-pink-500 to-rose-700',
  entertainment: 'from-fuchsia-500 to-pink-700',
  sports: 'from-green-500 to-emerald-700',
  science: 'from-violet-500 to-purple-700',
  health: 'from-rose-500 to-pink-700',
  world: 'from-emerald-500 to-teal-700',
  general: 'from-slate-500 to-gray-700',
};

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const article = await prisma.article.findUnique({ where: { id: parseInt(params.id) } });
    if (!article) return { title: 'Not Found - LiveNews' };
    return {
      title: `${article.titleKo || article.titleOriginal} - LiveNews`,
      description: article.summaryKo || article.titleOriginal,
    };
  } catch {
    return { title: 'LiveNews' };
  }
}

async function getArticle(id: number) {
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: { source: true },
    });
    if (!article) return null;
    prisma.article.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
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
          ...(article.categoryPrimary ? [{ categoryPrimary: article.categoryPrimary }] : []),
          { country: article.country },
        ],
      },
      include: { source: true },
      orderBy: { publishedAt: 'desc' },
      take: 6,
    });
  } catch {
    return [];
  }
}

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const article = await getArticle(id);
  if (!article) notFound();

  const related = await getRelatedArticles(article);
  const catColor = categoryColors[article.categoryPrimary || 'general'] || 'bg-emerald-600';
  const catLabel = article.categoryPrimary ? categoryLabel(article.categoryPrimary) : '';
  const catGradient = categoryGradients[article.categoryPrimary || 'general'] || 'from-slate-500 to-gray-700';
  const title = article.titleKo || article.titleOriginal;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-primary transition-colors">홈</Link>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        {article.country && (
          <>
            <Link href={`/${article.country === 'global' ? 'world' : article.country}`} className="hover:text-primary transition-colors">
              {countryLabel(article.country)}
            </Link>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </>
        )}
        {catLabel && (
          <Link href={`/category/${article.categoryPrimary}`} className="hover:text-primary transition-colors">{catLabel}</Link>
        )}
      </nav>

      <article>
        {/* Hero Image */}
        <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
          <img
            src={article.imageUrl || getDefaultImage(article.categoryPrimary, article.id)}
            alt={title}
            className="w-full h-auto max-h-[280px] sm:max-h-[450px] object-cover"
          />
        </div>

        {/* Category + Meta Row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {catLabel && (
            <span className={`${catColor} text-white text-sm font-bold px-3 py-1 rounded-lg`}>{catLabel}</span>
          )}
          <span className="text-sm text-gray-500">{article.source.sourceName}</span>
          <span className="text-sm text-gray-400">{formatDate(article.publishedAt)}</span>
          <span className="text-sm text-gray-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {timeAgo(article.publishedAt)}
          </span>
          {article.author && <span className="text-sm text-gray-500">{article.author}</span>}
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight text-gray-900 mb-3">
          {title}
        </h1>

        {/* Original Title (small, subtle) */}
        {article.titleKo && article.titleKo !== article.titleOriginal && (
          <p className="text-sm text-gray-400 mb-6 italic">
            {article.titleOriginal}
          </p>
        )}

        {/* Divider */}
        <hr className="border-gray-200 mb-8" />

        {/* Article Body - contentKo or summaryKo */}
        <div className="mb-8 prose prose-lg max-w-none">
          {article.contentKo ? (
            <div className="text-gray-800 leading-[1.9] text-base md:text-[17px] space-y-5">
              {article.contentKo.split('\n').filter(Boolean).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          ) : article.summaryKo ? (
            <div className="space-y-6">
              <div className="text-gray-800 leading-[1.9] text-lg md:text-xl">
                <p>{article.summaryKo}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <p className="text-sm text-gray-600 mb-3">이 기사의 전체 내용은 원문에서 확인하세요.</p>
                <a
                  href={article.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  원문 기사 읽기
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-gray-500 mb-4">기사 본문을 준비 중입니다.</p>
              <a
                href={article.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                원문에서 기사 읽기
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            </div>
          )}
        </div>

        {/* Original Content (collapsible) */}
        {article.contentOriginal && (
          <details className="mb-6 group">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1.5 py-2">
              <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              원문 보기 (English)
            </summary>
            <div className="mt-2 bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-500 leading-relaxed">
              {article.contentOriginal.split('\n').filter(Boolean).map((p, i) => (
                <p key={i} className="mb-2">{p}</p>
              ))}
            </div>
          </details>
        )}

        {/* Source Info + Actions */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400 border-t border-gray-100 pt-4 mb-8">
          <span>{article.source.sourceName}</span>
          <span>{formatDate(article.publishedAt)}</span>
          {article.author && <span>{article.author}</span>}
          <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gray-500 hover:text-primary transition-colors">
            원문 보기
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
          <Link href="/" className="text-gray-500 hover:text-primary transition-colors">목록으로</Link>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(article.originalUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-primary transition-colors"
          >
            공유
          </a>
        </div>

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full hover:bg-primary hover:text-white transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </article>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="border-t border-gray-200 pt-8">
          <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            관련 기사
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((a) => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
