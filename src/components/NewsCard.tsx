'use client';

import Link from 'next/link';
import { categoryLabel, getArticleImageSources, getDisplayTitle } from '@/lib/utils';
import type { Article } from '@/lib/types';
import ArticleImage from './ArticleImage';
import NewsCardMeta from './NewsCardMeta';

/** Card anatomy: photo, section label, title, summary, then source · wire time and the two icon actions. */
export default function NewsCard({ article }: { article: Article }) {
  const t = getDisplayTitle(article);
  const summary = article.summaryKo;
  const catLabel = article.categoryPrimary ? categoryLabel(article.categoryPrimary) : '';
  const sources = getArticleImageSources(article);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface-card transition-colors hover:bg-surface-elevated">
      <div className="relative h-40 w-full overflow-hidden bg-surface-elevated sm:h-44">
        <ArticleImage
          sources={sources}
          sizes="(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        {catLabel && <p className="mb-2 text-caption text-text-secondary">{catLabel}</p>}
        {/* The title link covers the whole card: its ::after is positioned against <article>. */}
        <Link href={`/article/${article.id}`} className="block after:absolute after:inset-0">
          <h3 lang={t.lang} className="text-headline-sm text-text line-clamp-3">
            {t.text}
          </h3>
        </Link>
        {summary && <p className="mt-2 text-body-md text-text-secondary line-clamp-2">{summary}</p>}
        <NewsCardMeta article={article} />
      </div>
    </article>
  );
}
