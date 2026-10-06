export const dynamic = 'force-dynamic';

import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import {
  categoryLabel,
  cn,
  countryLabel,
  formatDate,
  getArticleImageSources,
  getCategoryStyle,
  getDisplayTitle,
  timeAgo,
  toIsoDateTime,
  toLangTag,
} from '@/lib/utils';
import { isKnownCategorySlug, parseArticleId } from '@/lib/routing';
import { getArticleView } from '@/lib/article-view';
import NewsCard from '@/components/NewsCard';
import ShareButtons from '@/components/ShareButtons';
import BookmarkButton from '@/components/BookmarkButton';
import AdSlot from '@/components/AdSlot';
import ArticleHeroImage from '@/components/ArticleHeroImage';

/**
 * One lookup per request, shared by generateMetadata and the page.
 * Inactive articles are treated as missing. DB errors propagate (→ error.tsx), so an outage
 * is never disguised as a 404.
 */
const getArticle = cache(async (id: number) =>
  prisma.article.findFirst({
    where: { id, isActive: true },
    include: { source: true },
  }),
);

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Missing / inactive / malformed → notFound() here as well: Next then resolves the
  // not-found.tsx metadata for the RSC head, so the tab keeps '페이지를 찾을 수 없습니다 | LiveNews'
  // after hydration (returning {} would fall back to the root default title).
  // No loading.tsx in this segment, so the response is still a real 404.
  const id = parseArticleId(params.id);
  if (id === null) notFound();
  const article = await getArticle(id);
  if (!article) notFound();
  const summary = article.summaryKo?.trim();
  return {
    title: getDisplayTitle(article).text,
    description: summary || article.titleOriginal,
  };
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
      orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }],
      take: 6,
    });
  } catch {
    // Related articles are secondary — the article itself still renders
    return [];
  }
}

const BODY_TEXT = 'text-text leading-[1.9] text-base md:text-[17px] space-y-5';

const BODY_PENDING_NOTICE = {
  'summary+original': '본문 번역 준비 중 · 한국어 요약과 원문을 먼저 제공합니다',
  original: '본문 번역 준비 중 · 원문을 표시합니다',
  summary: '본문 번역 준비 중 · 한국어 요약만 제공됩니다',
} as const;

function Chevron({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  const id = parseArticleId(params.id);
  if (id === null) notFound();

  const article = await getArticle(id);
  if (!article) notFound();

  // Only real (active) article views are counted
  prisma.article.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const related = await getRelatedArticles(article);
  const view = getArticleView(article);

  // Category: link only to categories we serve; show a label without link for known labels
  // (e.g. 'opinion'); hide raw unknown slugs entirely.
  const catSlug = article.categoryPrimary || '';
  const catLinked = isKnownCategorySlug(catSlug);
  const catText = catSlug && categoryLabel(catSlug) !== catSlug ? categoryLabel(catSlug) : '';
  const catLabel = catLinked ? categoryLabel(catSlug) : catText;
  const catStyle = getCategoryStyle(catSlug || 'general');

  const dateLabel = formatDate(article.publishedAt);
  const dateTime = toIsoDateTime(article.publishedAt);
  const relative = dateLabel ? timeAgo(article.publishedAt) : '';

  const originalHeading = view.originalLabel === '원문' ? '원문' : `원문 · ${view.originalLabel}`;
  const originalBlock = (collapsed: boolean) =>
    view.originalParagraphs.length > 0 ? (
      <div data-original-body="" lang={view.originalLang} className={collapsed ? 'mt-2 bg-surface-elevated rounded-card p-4 border border-border' : ''}>
        <p className="text-overline uppercase tracking-widest text-text-muted mb-3">{originalHeading}</p>
        <div className={collapsed ? 'text-body-md text-text-secondary leading-relaxed space-y-2' : BODY_TEXT}>
          {view.originalParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav aria-label="현재 위치" className="text-body-md text-text-secondary mb-6 flex flex-wrap items-center gap-2">
        <Link href="/" className="hover:text-accent transition-colors">홈</Link>
        <Chevron className="w-3 h-3 text-text-muted" />
        {article.country && (
          <>
            <Link href={`/${article.country === 'global' ? 'world' : article.country}`} className="hover:text-accent transition-colors">
              {countryLabel(article.country)}
            </Link>
            {catLabel && <Chevron className="w-3 h-3 text-text-muted" />}
          </>
        )}
        {catLabel &&
          (catLinked ? (
            <Link href={`/category/${catSlug}`} className="hover:text-accent transition-colors">{catLabel}</Link>
          ) : (
            <span>{catLabel}</span>
          ))}
      </nav>

      <article>
        {/* Hero Image — decorative (the headline follows); no photo → low band with source wordmark */}
        <div className="mb-8 rounded-card overflow-hidden shadow-elevated bg-surface-elevated">
          <ArticleHeroImage
            sources={getArticleImageSources(article)}
            categoryPrimary={article.categoryPrimary}
            sourceName={article.source.sourceName}
          />
        </div>

        {/* Category + Meta Row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {catLabel && (
            <span className={cn(catStyle.bg, catStyle.text, 'border', catStyle.borderAll, 'text-caption font-bold px-3 py-1 rounded-badge')}>
              {catLabel}
            </span>
          )}
          <span className="text-body-md text-text-secondary">{article.source.sourceName}</span>
          {dateLabel && (
            <>
              <time dateTime={dateTime} className="text-body-md text-text-muted tabular-nums">{dateLabel}</time>
              <span className="text-body-md text-text-muted flex items-center gap-1">
                <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {relative}
              </span>
            </>
          )}
          {article.author && <span className="text-body-md text-text-secondary">{article.author}</span>}
          <div className="ml-auto">
            <BookmarkButton articleId={article.id} />
          </div>
        </div>

        {/* Title — source-language titles carry their own lang (CJK line breaking) */}
        <h1 lang={view.title.lang} className="text-headline-xl leading-tight text-text mb-3">
          {view.title.text}
        </h1>

        {view.titlePending ? (
          <p data-translation-status="title-pending" className="text-caption text-text-muted mb-4">
            제목 번역 준비 중 · 원문 제목을 표시합니다
          </p>
        ) : (
          view.title.isTranslated && (
            <p lang={toLangTag(article.language)} className="text-body-md text-text-muted mb-4 italic">
              {article.titleOriginal}
            </p>
          )
        )}

        {/* Share Buttons */}
        <div className="mb-6">
          <ShareButtons url={article.originalUrl} title={view.title.text} />
        </div>

        <hr className="border-border mb-8" />

        {/* Article Body — never hides what is missing: untranslated bodies get an editor's-note
            rail, the Korean summary first, then the labelled original. */}
        <div className="mb-8 space-y-8">
          {view.bodyPending && view.bodyMode !== 'translated' && view.bodyMode !== 'empty' && (
            <div data-translation-status="body-pending" className="border-l-2 border-accent/60 pl-3 text-caption text-text-secondary">
              {BODY_PENDING_NOTICE[view.bodyMode]}
            </div>
          )}

          {view.bodyMode === 'translated' && (
            <div className={BODY_TEXT}>
              {view.bodyParagraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          )}

          {(view.bodyMode === 'summary+original' || view.bodyMode === 'summary') && view.summary && (
            <section aria-label="한국어 요약">
              <p className="text-overline uppercase tracking-widest text-accent mb-3">요약</p>
              <div className={BODY_TEXT}>
                <p>{view.summary}</p>
              </div>
            </section>
          )}

          {(view.bodyMode === 'summary+original' || view.bodyMode === 'original') && originalBlock(false)}

          {view.bodyMode === 'empty' && (
            <p className="text-text-muted">
              본문이 제공되지 않는 기사입니다 · 아래 &apos;원문 보기&apos;로 원문 사이트에서 확인하세요
            </p>
          )}
        </div>

        {/* Original text, collapsed, when the Korean translation is the body */}
        {view.bodyMode === 'translated' && view.originalParagraphs.length > 0 && (
          <details className="mb-6 group">
            <summary className="cursor-pointer text-caption text-text-muted hover:text-text-secondary flex items-center gap-1.5 py-2 transition-colors">
              <Chevron className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
              {view.originalLabel === '원문' ? '원문 보기' : `원문 보기 (${view.originalLabel})`}
            </summary>
            {originalBlock(true)}
          </details>
        )}

        {/* Source Info + Actions */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-text-muted border-t border-border pt-4 mb-8">
          <span>{article.source.sourceName}</span>
          {dateLabel && <time dateTime={dateTime} className="tabular-nums">{dateLabel}</time>}
          {article.author && <span>{article.author}</span>}
          <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-text-secondary hover:text-accent transition-colors">
            원문 보기
            <svg aria-hidden="true" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
          <Link href="/" className="text-text-secondary hover:text-accent transition-colors">목록으로</Link>
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

      {/* Banner Ad */}
      <AdSlot size="banner" className="my-6" />

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
