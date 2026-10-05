'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NewsCard from '@/components/NewsCard';
import Pagination from '@/components/Pagination';
import { CATEGORIES, COUNTRIES } from '@/lib/constants';
import { parsePage } from '@/lib/utils';
import { withBasePath } from '@/lib/site';

interface Article {
  id: number;
  titleOriginal: string;
  titleKo: string | null;
  summaryKo: string | null;
  originalUrl: string;
  language?: string;
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
  // Garbage / out-of-range ?page= never reaches the API as NaN
  const page = parsePage(searchParams.get('page'));

  const [query, setQuery] = useState(q);
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // Bumped by "다시 시도" — re-runs the effect even though the URL did not change
  const [retryKey, setRetryKey] = useState(0);

  // Keep the input in sync when q changes through navigation (header link, back button)
  useEffect(() => { setQuery(q); }, [q]);

  useEffect(() => {
    if (!q) {
      // No query → no results: clear whatever the previous search left behind
      setArticles([]);
      setTotal(0);
      setTotalPages(0);
      setError(false);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ q, page: String(page) });
    if (country) params.set('country', country);
    if (category) params.set('category', category);

    fetch(withBasePath(`/api/search?${params}`), { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const nextTotal = Number(data.total) || 0;
        const nextPages = Number(data.totalPages) || 0;
        if (nextTotal > 0 && page > nextPages) {
          // Past the last page → jump to the last page instead of showing "no results"
          const fix = new URLSearchParams({ q });
          if (country) fix.set('country', country);
          if (category) fix.set('category', category);
          if (nextPages > 1) fix.set('page', String(nextPages));
          router.replace(`/search?${fix}`);
          return;
        }
        setArticles(Array.isArray(data.articles) ? data.articles : []);
        setTotal(nextTotal);
        setTotalPages(nextPages);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('[search] fetch failed:', err);
        setError(true);
        setArticles([]);
        setTotal(0);
        setTotalPages(0);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // router is stable; retryKey forces a refetch for the same URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, country, category, page, retryKey]);

  /** Pagination link pattern ('[page]' is substituted by <Pagination>). */
  const pagePattern = (() => {
    const sp = new URLSearchParams({ q });
    if (country) sp.set('country', country);
    if (category) sp.set('category', category);
    return `/search?${sp}&page=[page]`;
  })();

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
          <label htmlFor="search-country" className="text-body-md text-text-secondary">국가</label>
          <select
            id="search-country"
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
          <label htmlFor="search-category" className="text-body-md text-text-secondary">카테고리</label>
          <select
            id="search-category"
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

      {error ? (
        <div className="text-center py-20">
          <div role="alert">
            <p className="text-headline-sm text-accent-red">검색 중 오류가 발생했습니다</p>
            <p className="text-body-md text-text-muted mt-2">잠시 후 다시 시도해주세요</p>
          </div>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="mt-4 px-4 py-2 bg-accent text-white rounded-card text-body-md font-semibold hover:bg-accent/90 transition-colors"
          >
            다시 시도
          </button>
        </div>
      ) : loading ? (
        <div role="status" className="text-center py-20 text-text-muted">
          <div aria-hidden="true" className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
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

          {/* Pagination — shared component (mobile-safe, numbered) */}
          {q && totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} basePath={pagePattern} />
          )}
        </>
      )}
    </div>
  );
}
