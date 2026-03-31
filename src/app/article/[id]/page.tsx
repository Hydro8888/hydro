export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { formatDate, countryLabel, categoryLabel, timeAgo } from '@/lib/utils';
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-8 flex items-center gap-2">
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
          <Link href={`/category/${article.categoryPrimary}`} className="hover:text-primary transition-colors">
            {catLabel}
          </Link>
        )}
      </nav>

      <article>
        {/* Category Badge + Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {catLabel && (
            <span className={`${catColor} text-white text-sm font-bold px-3 py-1.5 rounded-lg`}>
              {catLabel}
            </span>
          )}
          <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
            {article.source.sourceName}
          </span>
          <span className="text-sm text-gray-400">
            {formatDate(article.publishedAt)}
          </span>
          <span className="text-sm text-gray-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {timeAgo(article.publishedAt)}
          </span>
          {article.author && (
            <span className="text-sm text-gray-500">
              <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              {article.author}
            </span>
          )}
        </div>

        {/* Korean Title (Main) */}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-gray-900 mb-4">
          {article.titleKo || article.titleOriginal}
        </h1>

        {/* Original Title */}
        {article.titleKo && article.titleKo !== article.titleOriginal && (
          <p className="text-base text-gray-400 mb-6 italic border-l-2 border-gray-200 pl-4">
            {article.titleOriginal}
          </p>
        )}

        {/* Featured Image */}
        {article.imageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
            <img
              src={article.imageUrl}
              alt={article.titleKo || article.titleOriginal}
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Korean Translation - Full Content */}
        {(article.contentKo || article.summaryKo) && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 border border-blue-100">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800">한국어 번역</h2>
                <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">AI 번역</span>
              </div>
              <div className="prose prose-lg max-w-none">
                {article.contentKo ? (
                  <div className="text-gray-700 leading-relaxed text-base md:text-lg space-y-4">
                    {article.contentKo.split('\n').filter(Boolean).map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                ) : article.summaryKo ? (
                  <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                    {article.summaryKo}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Original Content (collapsible) */}
        {article.contentOriginal && (
          <details className="mb-8 group">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 py-2">
              <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              원문 내용 보기 (English)
            </summary>
            <div className="mt-3 bg-gray-50 rounded-xl p-5 border border-gray-200 text-sm text-gray-600 leading-relaxed">
              {article.contentOriginal.split('\n').filter(Boolean).map((p, i) => (
                <p key={i} className="mb-3">{p}</p>
              ))}
            </div>
          </details>
        )}

        {/* Original Source Info - 컴팩트 한줄 */}
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 border-t border-gray-100 pt-4">
          <span>소스: <span className="text-gray-600">{article.source.sourceName}</span></span>
          <span>원문: <span className="text-gray-600 italic">{article.titleOriginal.length > 60 ? article.titleOriginal.slice(0, 60) + '...' : article.titleOriginal}</span></span>
          {article.author && <span>저자: <span className="text-gray-600">{article.author}</span></span>}
          <span>{formatDate(article.publishedAt)}</span>
          <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            원문 바로가기 &rarr;
          </a>
        </div>

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="text-sm bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Action Buttons - 작은 보조 버튼 */}
        <div className="flex flex-wrap gap-2 mb-10">
          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            원문 보기
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            목록으로
          </Link>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.titleKo || article.titleOriginal)}&url=${encodeURIComponent(article.originalUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            공유
          </a>
        </div>
      </article>

      {/* Related Articles - 3 Column Grid */}
      {related.length > 0 && (
        <section className="border-t-2 border-gray-100 pt-10">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
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
