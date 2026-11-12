'use client';

import Link from 'next/link';
import { categoryLabel, cn, getArticleImageSources, getDisplayTitle } from '@/lib/utils';
import { LEAD_HEADLINE_CLASS, leadHeadlineTier } from '@/lib/headline';
import type { Article } from '@/lib/types';
import ArticleImage from './ArticleImage';
import NewsCardMeta from './NewsCardMeta';

interface NewsCardLargeProps {
  article: Article;
  /** Above the fold: load the photo first. */
  priority?: boolean;
  /** Home lead story only: serif headline and a taller photo. */
  lead?: boolean;
}

export default function NewsCardLarge({ article, priority = false, lead = false }: NewsCardLargeProps) {
  const t = getDisplayTitle(article);
  const summary = article.summaryKo;
  const catLabel = article.categoryPrimary ? categoryLabel(article.categoryPrimary) : '';
  const sources = getArticleImageSources(article);

  return (
    <article
      data-lead={lead ? '' : undefined}
      className="relative flex flex-col overflow-hidden rounded-card border border-border bg-surface-card transition-colors hover:bg-surface-elevated"
    >
      <div className={cn('relative w-full overflow-hidden bg-surface-elevated', lead ? 'h-56 sm:h-80 lg:h-96' : 'h-52 sm:h-64')}>
        <ArticleImage
          sources={sources}
          sizes="(min-width: 1024px) 840px, 100vw"
          priority={priority}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        {catLabel && <p className="mb-2 text-caption text-text-secondary">{catLabel}</p>}
        {/* The title link covers the whole card: its ::after is positioned against <article>. */}
        <Link href={`/article/${article.id}`} className="block after:absolute after:inset-0">
          {lead ? (
            // pb-1: a clamped serif line at line-height 1.2 would otherwise lose its descenders (g, y, p).
            <h2
              lang={t.lang}
              className={cn('pb-1 font-serif text-text text-balance line-clamp-4 sm:line-clamp-3', LEAD_HEADLINE_CLASS[leadHeadlineTier(t.text)])}
            >
              {t.text}
            </h2>
          ) : (
            <h2 lang={t.lang} className="text-headline-md text-text line-clamp-3">
              {t.text}
            </h2>
          )}
        </Link>
        {summary && (
          <p className={cn('text-body-lg text-text-secondary line-clamp-3', lead ? 'mt-2 max-w-xl' : 'mt-3')}>{summary}</p>
        )}
        <NewsCardMeta article={article} />
      </div>
    </article>
  );
}
