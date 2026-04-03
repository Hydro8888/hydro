'use client';

import Link from 'next/link';
import Image from 'next/image';
import { timeAgo, categoryLabel, getDefaultImage, getCategoryStyle, cn } from '@/lib/utils';
import type { Article } from '@/lib/types';

export default function NewsCardLarge({ article }: { article: Article }) {
  const title = article.titleKo || article.titleOriginal;
  const summary = article.summaryKo;
  const catStyle = getCategoryStyle(article.categoryPrimary || 'general');
  const catLabel = article.categoryPrimary ? categoryLabel(article.categoryPrimary) : '';

  return (
    <article className="group flex flex-col overflow-hidden rounded-card bg-surface-card border border-border-muted hover:border-border hover:shadow-elevated transition-all duration-300">
      {/* Image */}
      <Link href={`/article/${article.id}`} className="relative block h-[200px] sm:h-[260px] w-full overflow-hidden bg-surface-elevated">
        <Image
          src={article.imageUrl || getDefaultImage(article.categoryPrimary, article.id)}
          alt={title}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay from dark surface */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/40 to-transparent" />

        {/* Overlaid category badge */}
        {catLabel && (
          <span className={cn(
            'absolute bottom-3 left-3 border-l-2 px-2.5 py-1 rounded-badge text-caption backdrop-blur-sm',
            catStyle.border, catStyle.text, catStyle.bg
          )}>
            {catLabel}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Meta */}
        <div className="mb-3 flex flex-wrap items-center gap-2 text-caption">
          <span className="text-text-secondary">
            {article.source.sourceName}
          </span>
          <span className="text-text-muted">
            {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
          <span className="text-text-muted flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {timeAgo(article.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <Link href={`/article/${article.id}`}>
          <h2 className="mb-2 text-headline-lg text-text group-hover:text-accent transition-colors line-clamp-2">
            {title}
          </h2>
        </Link>

        {/* Summary */}
        {summary && (
          <p className="mb-4 text-body-lg text-text-secondary line-clamp-3">
            {summary}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border-muted">
          <Link
            href={`/article/${article.id}`}
            className="text-body-md font-semibold text-accent hover:text-accent-blue transition-colors flex items-center gap-1"
          >
            자세히 보기
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-text-muted hover:text-text-secondary transition-colors"
            title="원문 보기"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>
      </div>
    </article>
  );
}
