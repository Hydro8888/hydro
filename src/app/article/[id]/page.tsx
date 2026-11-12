export const dynamic = 'force-dynamic';

import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { CONTAINER, TAG } from '@/lib/ui';
import {
  categoryLabel,
  cn,
  countryLabel,
  formatDate,
  getArticleImageSources,
  getDisplayTitle,
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
import { ChevronRightIcon, ExternalIcon } from '@/components/icons';

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

// Reading text: 16/28 on a phone, 18/32 from sm, 24px between paragraphs.
const BODY_TEXT = 'space-y-6 text-base leading-7 text-text sm:text-lg sm:leading-8';
// Editor's notes (translation pending, excerpt only): a neutral rule, never the accent.
const NOTE = 'border-l-2 border-border pl-3 text-caption text-text-secondary';
const QUIET_LINK = 'transition-colors hover:text-text';

const BODY_PENDING_NOTICE = {
  'summary+original': '본문 번역 준비 중 · 한국어 요약과 원문을 먼저 제공합니다',
  original: '본문 번역 준비 중 · 원문을 표시합니다',
  summary: '본문 번역 준비 중 · 한국어 요약만 제공됩니다',
} as const;

// Dateline items are separated by a middle dot that sits in each item's 16px left padding.
const DATELINE_ITEM = 'relative pl-4';

function Dot() {
  return (
    <span aria-hidden="true" className="absolute left-0 w-4 text-center text-text-muted">
      ·
    </span>
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

  // A permanent record, so the full date (KST): 2026.11.12 06:31
  const dateLabel = formatDate(article.publishedAt);
  const dateTime = toIsoDateTime(article.publishedAt);

  // Dateline: source · time · author. Printed at the head and again at the foot of the article.
  // The row is pulled 16px to the left and clipped, so the dot of whichever item starts a line
  // (the first one, or one that wrapped) is not shown: no dot is left hanging at either end of a line.
  const dateline = (
    <p className="min-w-0 overflow-hidden text-body-md text-text-secondary">
      <span className="-ml-4 flex flex-wrap items-baseline gap-y-1">
        <span className={DATELINE_ITEM}>
          <Dot />
          {article.source.sourceName}
        </span>
        {dateLabel && (
          <span className={DATELINE_ITEM}>
            <Dot />
            <time dateTime={dateTime} className="dateline">
              {dateLabel}
            </time>
          </span>
        )}
        {article.author && (
          <span className={cn(DATELINE_ITEM, 'min-w-0 break-words text-text-muted')}>
            <Dot />
            {article.author}
          </span>
        )}
      </span>
    </p>
  );

  const originalHeading = view.originalLabel === '원문' ? '원문' : `원문 · ${view.originalLabel}`;
  const originalBlock = (collapsed: boolean) =>
    view.originalParagraphs.length > 0 ? (
      <div
        data-original-body=""
        lang={view.originalLang}
        className={collapsed ? 'mt-2 rounded-card border border-border bg-surface-card p-5' : undefined}
      >
        <p className="mb-2 text-overline text-text-muted">{originalHeading}</p>
        <div className={collapsed ? 'space-y-3 text-body-md text-text-secondary' : BODY_TEXT}>
          {view.originalParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className={cn(CONTAINER, 'py-8')}>
      {/* One reading column inside the page container: 672px, about 37 Hangul per line at 18px. */}
      <div className="mx-auto max-w-2xl">
        {/* Breadcrumb */}
        <nav aria-label="현재 위치" className="mb-4 flex flex-wrap items-center gap-2 text-body-md text-text-secondary">
          <Link href="/" className={QUIET_LINK}>홈</Link>
          {article.country && (
            <>
              <span aria-hidden="true" className="text-text-muted">/</span>
              <Link href={`/${article.country === 'global' ? 'world' : article.country}`} className={QUIET_LINK}>
                {countryLabel(article.country)}
              </Link>
            </>
          )}
          {catLabel && (
            <>
              <span aria-hidden="true" className="text-text-muted">/</span>
              {catLinked ? (
                <Link href={`/category/${catSlug}`} className={QUIET_LINK}>{catLabel}</Link>
              ) : (
                <span>{catLabel}</span>
              )}
            </>
          )}
        </nav>

        <article>
          {/* Hero Image — decorative (the headline follows); no photo → low band with source wordmark */}
          <div className="mb-6 overflow-hidden rounded-card bg-surface-elevated">
            <ArticleHeroImage sources={getArticleImageSources(article)} sourceName={article.source.sourceName} />
          </div>

          <div className="mb-3 flex items-start justify-between gap-3">
            {dateline}
            {/* -my-1: the 32px button does not make the row taller than its text line */}
            <div className="-my-1 shrink-0">
              <BookmarkButton articleId={article.id} />
            </div>
          </div>

          {/* Title — source-language titles carry their own lang (CJK line breaking) */}
          <h1 lang={view.title.lang} className="mb-3 font-serif text-headline-xl text-text text-balance">
            {view.title.text}
          </h1>

          {view.titlePending ? (
            <p data-translation-status="title-pending" className="mb-6 text-caption text-text-muted">
              제목 번역 준비 중 · 원문 제목을 표시합니다
            </p>
          ) : (
            view.title.isTranslated && (
              <p lang={toLangTag(article.language)} className="mb-6 text-body-md text-text-secondary">
                {article.titleOriginal}
              </p>
            )
          )}

          {/* Share row (carries its own label) */}
          <div className="mb-6">
            <ShareButtons url={article.originalUrl} title={view.title.text} />
          </div>

          <hr className="mb-8 border-border" />

          {/* Article Body — never hides what is missing: untranslated bodies get an editor's-note
              rail, the Korean summary first, then the labelled original. */}
          <div className="mb-8 space-y-8">
            {view.bodyPending && view.bodyMode !== 'translated' && view.bodyMode !== 'empty' && (
              <div data-translation-status="body-pending" className={NOTE}>
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
                <p className="mb-2 text-overline text-text-muted">요약</p>
                <div className={BODY_TEXT}>
                  <p>{view.summary}</p>
                </div>
              </section>
            )}

            {(view.bodyMode === 'summary+original' || view.bodyMode === 'original') && originalBlock(false)}

            {view.isExcerpt && view.bodyMode !== 'empty' && (
              <p data-body-excerpt className={NOTE}>
                원문 매체({article.source.sourceName})가 기사 앞부분만 제공해 요약 분량만 실려 있습니다 ·{' '}
                <a
                  href={article.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn('underline underline-offset-2', QUIET_LINK)}
                >
                  전체 기사 원문 보기
                </a>
              </p>
            )}

            {view.bodyMode === 'empty' && (
              <p className="text-body-md text-text-secondary">
                본문이 제공되지 않는 기사입니다 · 아래 &apos;원문 보기&apos;로 원문 사이트에서 확인하세요
              </p>
            )}
          </div>

          {/* Original text, collapsed, when the Korean translation is the body */}
          {view.bodyMode === 'translated' && view.originalParagraphs.length > 0 && (
            <details className="group mb-6">
              <summary className={cn('inline-flex h-10 cursor-pointer items-center gap-2 text-body-md text-text-secondary', QUIET_LINK)}>
                <span className="inline-flex transition-transform group-open:rotate-90">
                  <ChevronRightIcon />
                </span>
                {view.originalLabel === '원문' ? '원문 보기' : `원문 보기 (${view.originalLabel})`}
              </summary>
              {originalBlock(true)}
            </details>
          )}

          {/* Foot: the same dateline, then the way out to the source and back to the list */}
          <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-body-md text-text-secondary">
            {dateline}
            <a
              href={article.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('inline-flex items-center gap-2', QUIET_LINK)}
            >
              원문 보기
              <ExternalIcon />
            </a>
            <Link href="/" className={QUIET_LINK}>목록으로</Link>
          </div>

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className={TAG}>
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </article>

        {/* Banner Ad */}
        <AdSlot size="banner" className="my-8" />

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="border-t border-border pt-8">
            <h2 className="mb-4 text-headline-md text-text">관련 기사</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {related.map((a) => (
                <NewsCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
