'use client';

import Link from 'next/link';
import Image from 'next/image';
import { timeAgo, countryLabel, categoryLabel } from '@/lib/utils';
import SourceBadge from './SourceBadge';

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

interface NewsCardProps {
  article: Article;
}

export default function NewsCard({ article }: NewsCardProps) {
  const title = article.titleKo || article.titleOriginal;

  return (
    <article className="group flex gap-3 rounded-lg bg-white p-3 transition-colors hover:bg-gray-50 border border-gray-100 hover:border-gray-200">
      {/* Thumbnail */}
      <Link
        href={`/article/${article.id}`}
        className="relative h-20 w-[120px] flex-none overflow-hidden rounded-md bg-gray-100"
      >
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={title}
            fill
            sizes="120px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2"
              />
            </svg>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          {/* Meta row */}
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <SourceBadge sourceName={article.source.sourceName} country={article.country} />
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
              {countryLabel(article.country)}
            </span>
            {article.categoryPrimary && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700">
                {categoryLabel(article.categoryPrimary)}
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/article/${article.id}`}>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
          </Link>
        </div>

        {/* Bottom row */}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400">{timeAgo(article.publishedAt)}</span>
          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-none text-xs text-gray-400 underline underline-offset-2 hover:text-blue-600 transition-colors"
          >
            원문
          </a>
        </div>
      </div>
    </article>
  );
}
