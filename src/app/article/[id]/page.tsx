export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { formatDate, countryLabel, categoryLabel, timeAgo, getDefaultImage, getCategoryStyle } from '@/lib/utils';
import { CATEGORY_COLORS } from '@/lib/constants';
import NewsCard from '@/components/NewsCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

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
  const catSlug = article.categoryPrimary || 'general';
  const catStyle = getCategoryStyle(catSlug);
  const catLabel = article.categoryPrimary ? categoryLabel(article.categoryPrimary) : '';
  const title = article.titleKo || article.titleOriginal;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="text-body-md text-text-secondary mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-accent transition-colors">홈</Link>
        <svg className="w-3 h-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        {article.country && (
          <>
            <Link href={`/${article.country === 'global' ? 'world' : article.country}`} className="hover:text-accent transition-colors">
              {countryLabel(article.country)}
            </Link>
            <svg className="w-3 h-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </>
        )}
        {catLabel && (
          <Link href={`/category/${article.categoryPrimary}`} className="hover:text-accent transition-colors">{catLabel}</Link>
        )}
      </nav>

      <article>
        {/* Hero Image */}
        <div className="mb-8 rounded-card overflow-hidden shadow-elevated">
          <img
            src={article.imageUrl || getDefaultImage(article.categoryPrimary, article.id)}
            alt={title}
            className="w-full h-auto max-h-[280px] sm:max-h-[450px] object-cover"
          />
        </div>

        {/* Category + Meta Row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {catLabel && (
            <span className={`${catStyle.bg} ${catStyle.text} text-caption font-bold px-3 py-1 rounded-badge border ${catStyle.border.replace('border-l-', 'border-')}`}>
              {catLabel}
            </span>
          )}
          <span className="text-body-md text-text-secondary">{article.source.sourceName}</span>
          <span className="text-body-md text-text-muted">{formatDate(article.publishedAt)}</span>
          <span className="text-body-md text-text-muted flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {timeAgo(article.publishedAt)}
          </span>
          {article.author && <span className="text-body-md text-text-secondary">{article.author}</span>}
        </div>

        {/* Title */}
        <h1 className="text-headline-xl leading-tight text-text mb-3">
          {title}
        </h1>

        {/* Original Title (small, subtle) */}
        {article.titleKo && article.titleKo !== article.titleOriginal && (
          <p className="text-body-md text-text-muted mb-6 italic">
            {article.titleOriginal}
          </p>
        )}

        {/* Divider */}
        <hr className="border-border mb-8" />

        {/* Article Body - contentKo or summaryKo */}
        <div className="mb-8">
          {article.contentKo ? (
            <div className="text-text leading-[1.9] text-base md:text-[17px] space-y-5">
              {article.contentKo.split('\n').filter(Boolean).map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          ) : article.summaryKo ? (
            <div className="text-text leading-[1.9] text-base md:text-[17px] space-y-5">
              <p>{article.summaryKo}</p>
            </div>
          ) : (
            <p className="text-text-muted italic">기사 본문을 준비 중입니다.</p>
          )}
        </div>

        {/* Original Content (collapsible) */}
        {article.contentOriginal && (
          <details className="mb-6 group">
            <summary className="cursor-pointer text-caption text-text-muted hover:text-text-secondary flex items-center gap-1.5 py-2 transition-colors">
              <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              원문 보기 (English)
            </summary>
            <div className="mt-2 bg-surface-elevated rounded-card p-4 border border-border text-body-md text-text-secondary leading-relaxed">
              {article.contentOriginal.split('\n').filter(Boolean).map((p, i) => (
                <p key={i} className="mb-2">{p}</p>
              ))}
            </div>
          </details>
        )}

        {/* Source Info + Actions */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-text-muted border-t border-border pt-4 mb-8">
          <span>{article.source.sourceName}</span>
          <span>{formatDate(article.publishedAt)}</span>
          {article.author && <span>{article.author}</span>}
          <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-text-secondary hover:text-accent transition-colors">
            원문 보기
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
          <Link href="/" className="text-text-secondary hover:text-accent transition-colors">목록으로</Link>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(article.originalUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-accent transition-colors"
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
                className="text-caption bg-surface-elevated text-text-secondary px-2.5 py-1 rounded-pill border border-border hover:border-accent hover:text-accent transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </article>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="border-t border-border pt-8">
          <h2 className="text-headline-md text-text mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-accent rounded-full"></span>
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
