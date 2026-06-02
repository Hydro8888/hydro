'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NewsCard from '@/components/NewsCard';
import { CATEGORIES, COUNTRIES } from '@/lib/constants';

interface Article {
  id: number;
  titleOriginal: string;
  titleKo: string | null;
  summaryKo: string | null;
  originalUrl: string;
  country: string;
  categoryPrimary: string | null;
  publishedAt: string | null;
  imageUrl: string | null;
  source: { sourceName: string };
}

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-text-muted">로딩 중...</div>}>
      <SearchPage />
    </Suspense>
  );
}

function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const country = searchParams.get('country') || '';
  const category = searchParams.get('category') || '';
  const pageParam = searchParams.get('page') || '1';

  const [query, setQuery] = useState(q);
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const page = parseInt(pageParam);

  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ q, page: pageParam });
    if (country) params.set('country', country);
    if (category) params.set('category', category);

    fetch(`/livenews/api/search?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setArticles(data.articles || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [q, country, category, pageParam]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const params = new URLSearchParams({ q: query.trim() });
    if (country) params.set('country', country);
    if (category) params.set('category', category);
    router.push(`/search?${params}`);
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8">
      <h1 className="text-headline-lg text-text mb-6">뉴스 검색</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="키워드를 입력하세요..."
            className="flex-1 px-4 py-3 bg-surface-card border border-border rounded-card text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-body-lg transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-accent text-white rounded-card font-medium hover:bg-accent/90 transition-colors"
          >
            검색
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 mb-6">
        <div className="flex gap-2 items-center">
          <span className="text-body-md text-text-secondary">국가:</span>
          <select
            value={country}
            onChange={(e) => {
              const params = new URLSearchParams({ q });
              if (e.target.value) params.set('country', e.target.value);
              if (category) params.set('category', category);
              router.push(`/search?${params}`);
            }}
            className="text-body-md bg-surface-elevated border border-border text-text rounded-badge px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">전체</option>
            {COUNTRIES.filter((c) => c.code !== 'all').map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-body-md text-text-secondary">카테고리:</span>
          <select
            value={category}
            onChange={(e) => {
              const params = new URLSearchParams({ q });
              if (country) params.set('country', country);
              if (e.target.value) params.set('category', e.target.value);
              router.push(`/search?${params}`);
            }}
            className="text-body-md bg-surface-elevated border border-border text-text rounded-badge px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">전체</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {q && (
        <div className="mb-4 text-body-md text-text-secondary">
          &quot;{q}&quot; 검색 결과: {total}건
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-text-muted">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          검색 중...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>

          {q && articles.length === 0 && (
            <div className="text-center py-20">
              <p className="text-headline-sm text-text-secondary">검색 결과가 없습니다</p>
              <p className="text-body-md text-text-muted mt-2">다른 키워드로 검색해보세요</p>
            </div>
          )}

          {!q && (
            <div className="text-center py-20">
              <p className="text-headline-sm text-text-secondary">검색어를 입력해주세요</p>
              <p className="text-body-md text-text-muted mt-2">글로벌 뉴스를 키워드, 국가, 카테고리별로 검색할 수 있습니다</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {page > 1 && (
                <Link
                  href={`/search?q=${encodeURIComponent(q)}&page=${page - 1}${country ? `&country=${country}` : ''}${category ? `&category=${category}` : ''}`}
                  className="px-4 py-2 border border-border rounded-card text-text-secondary hover:border-accent hover:text-accent transition-colors"
                >
                  이전
                </Link>
              )}
              <span className="px-4 py-2 text-body-md text-text-muted">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/search?q=${encodeURIComponent(q)}&page=${page + 1}${country ? `&country=${country}` : ''}${category ? `&category=${category}` : ''}`}
                  className="px-4 py-2 border border-border rounded-card text-text-secondary hover:border-accent hover:text-accent transition-colors"
                >
                  다음
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
