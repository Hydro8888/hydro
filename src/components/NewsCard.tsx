'use client';

import Link from 'next/link';
import Image from 'next/image';
import { timeAgo, categoryLabel, getDefaultImage } from '@/lib/utils';

interface Article {
  id: number | string;
  titleOriginal: string;
  titleKo: string | null;
  summaryKo: string | null;
  source: { sourceName: string };
  country: string;
  categoryPrimary: string | null;
  publishedAt: string | Date | null;
  imageUrl: string | null;
  originalUrl: string;
}

const categoryColors: Record<string, string> = {
  politics: 'bg-red-600', economy: 'bg-blue-600', market: 'bg-indigo-600',
  business: 'bg-purple-600', 'ai-tech': 'bg-cyan-600', semiconductor: 'bg-teal-600',
  automotive: 'bg-orange-600', energy: 'bg-yellow-600', society: 'bg-gray-600',
  culture: 'bg-pink-600', entertainment: 'bg-fuchsia-600', sports: 'bg-green-600',
  science: 'bg-violet-600', health: 'bg-rose-600', world: 'bg-emerald-600',
  general: 'bg-slate-600',
};

export default function NewsCard({ article }: { article: Article }) {
  const title = article.titleKo || article.titleOriginal;
  const summary = article.summaryKo;
  const catColor = categoryColors[article.categoryPrimary || 'general'] || 'bg-emerald-600';
  const catLabel = article.categoryPrimary ? categoryLabel(article.categoryPrimary) : '';

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <Link href={`/article/${article.id}`} className="relative block h-[160px] sm:h-[180px] w-full overflow-hidden bg-gray-100">
        <Image
          src={article.imageUrl || getDefaultImage(article.categoryPrimary, article.id)}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized
        />
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Meta */}
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          {catLabel && (
            <span className={`${catColor} text-white font-bold px-2 py-0.5 rounded`}>
              {catLabel}
            </span>
          )}
          <span className="text-gray-500">{article.source.sourceName}</span>
          <span className="text-gray-400">
            {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
          <span className="text-gray-400 flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {timeAgo(article.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <Link href={`/article/${article.id}`}>
          <h3 className="mb-2 text-base font-bold leading-snug text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>

        {/* Summary */}
        {summary && (
          <p className="mb-3 text-sm leading-relaxed text-gray-500 line-clamp-2">
            {summary}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
          <Link
            href={`/article/${article.id}`}
            className="text-sm font-semibold text-primary hover:text-blue-700 transition-colors flex items-center gap-1"
          >
            자세히 보기
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="원문 보기"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>
      </div>
    </article>
  );
}
