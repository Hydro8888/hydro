import NewsCard from './NewsCard';

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

interface ArticleListProps {
  articles: Article[];
  /** Optional heading shown above the list */
  heading?: string;
}

export default function ArticleList({ articles, heading }: ArticleListProps) {
  return (
    <section>
      {heading && (
        <h2 className="mb-3 text-base font-bold text-gray-900">{heading}</h2>
      )}

      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mb-3 h-10 w-10 text-gray-300"
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
          <p className="text-sm font-medium text-gray-500">표시할 기사가 없습니다.</p>
          <p className="mt-1 text-xs text-gray-400">다른 카테고리나 국가를 선택해보세요.</p>
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
