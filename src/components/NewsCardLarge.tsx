import Link from 'next/link';
import Image from 'next/image';
import { timeAgo, truncate, countryLabel, categoryLabel } from '@/lib/utils';
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

interface NewsCardLargeProps {
  article: Article;
}

export default function NewsCardLarge({ article }: NewsCardLargeProps) {
  const title = article.titleKo || article.titleOriginal;
  const summary = article.summaryKo;

  return (
    <article className="group overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <Link href={`/article/${article.id}`} className="relative block h-[200px] w-full bg-gray-100">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-300"
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

        {/* Category overlay badge */}
        {article.categoryPrimary && (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center rounded-full bg-blue-600/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {categoryLabel(article.categoryPrimary)}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Meta row */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <SourceBadge sourceName={article.source.sourceName} country={article.country} />
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
            {countryLabel(article.country)}
          </span>
        </div>

        {/* Title */}
        <Link href={`/article/${article.id}`}>
          <h2 className="mb-2 text-base font-bold leading-snug text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-3">
            {title}
          </h2>
        </Link>

        {/* Summary */}
        {summary && (
          <p className="mb-3 text-sm leading-relaxed text-gray-600 line-clamp-3">
            {truncate(summary, 120)}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-xs text-gray-400">{timeAgo(article.publishedAt)}</span>
          <a
            href={article.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 underline underline-offset-2 hover:text-blue-600 transition-colors"
          >
            원문 보기
          </a>
        </div>
      </div>
    </article>
  );
}
