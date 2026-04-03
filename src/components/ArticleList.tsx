import NewsCard from './NewsCard';
import type { Article } from '@/lib/types';

interface ArticleListProps {
  articles: Article[];
  /** Optional heading shown above the list */
  heading?: string;
}

export default function ArticleList({ articles, heading }: ArticleListProps) {
  return (
    <section>
      {heading && (
        <h2 className="mb-3 text-headline-sm text-text">{heading}</h2>
      )}

      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface-card py-16 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mb-3 h-10 w-10 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-body-md font-medium text-text-secondary">표시할 기사가 없습니다.</p>
          <p className="mt-1 text-caption text-text-muted">다른 카테고리나 국가를 선택해보세요.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {articles.map((article) => (
            <li key={article.id}>
              <NewsCard article={article} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
