'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NewsCard from '@/components/NewsCard';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';
import PageHeading from '@/components/PageHeading';
import { CATEGORIES, COUNTRIES } from '@/lib/constants';
import { BTN_PRIMARY, BTN_SECONDARY, CONTAINER, FIELD, FIELD_SM, NUM } from '@/lib/ui';
import { cn, formatCount, parsePage } from '@/lib/utils';
import { withBasePath } from '@/lib/site';

interface Article {
  id: number;
  titleOriginal: string;
  titleKo: string | null;
  summaryKo: string | null;
  originalUrl: string;
  language: string | null;
  country: string;
  categoryPrimary: string | null;
  publishedAt: string | null;
  imageUrl: string | null;
  source: { sourceName: string };
}

export default function SearchPageWrapper() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-body-md text-text-secondary">불러오는 중</div>}>
      <SearchPage />
    </Suspense>
  );
}

function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // A query of spaces only is no query: the same screen as an empty one, and no request
  const q = (searchParams.get('q') || '').trim();
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
    <div className={cn(CONTAINER, 'py-8')}>
      <PageHeading title="뉴스 검색" />

      {/* The one primary action of this screen */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="검색어"
          placeholder="검색어"
          className={cn(FIELD, 'min-w-0 flex-1')}
        />
        <button type="submit" className={BTN_PRIMARY}>
          검색
        </button>
      </form>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-x-4 gap-y-3">
        <div className="flex items-center gap-2">
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
            className={FIELD_SM}
          >
            <option value="">전체</option>
            {COUNTRIES.filter((c) => c.code !== 'all').map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
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
            className={FIELD_SM}
          >
            <option value="">전체</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results — count only once it is actually known (not while loading / after an error) */}
      {q && !error && !loading && (
        <p className="mb-4 text-body-md text-text-secondary">
          “{q}” 검색 결과 <span className={cn(NUM, 'text-text')}>{formatCount(total)}</span>건
        </p>
      )}

      {error ? (
        <EmptyState alert title="검색하지 못했습니다" detail="잠시 후 다시 시도하세요">
          <button type="button" onClick={() => setRetryKey((k) => k + 1)} className={BTN_SECONDARY}>
            다시 시도
          </button>
        </EmptyState>
      ) : loading ? (
        <div role="status" className="py-16 text-center text-body-md text-text-secondary">
          {/* `animate-spin` is what scripts/qa/ui-audit.js looks for to detect a stuck spinner */}
          <div aria-hidden="true" className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-text-secondary" />
          검색 중
        </div>
      ) : (
        <>
          {/* Heading level between the page title (h1) and the card titles (h3) */}
          {articles.length > 0 && <h2 className="sr-only">검색 결과</h2>}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <NewsCard key={article.id} article={{ ...article, language: article.language ?? undefined }} />
            ))}
          </div>

          {q && articles.length === 0 && <EmptyState title="검색 결과가 없습니다" detail="다른 검색어로 다시 찾아보세요" />}

          {!q && <EmptyState title="검색어를 입력하세요" detail="국가와 카테고리로 결과를 좁힐 수 있습니다" />}

          {/* Pagination — shared component (mobile-safe, numbered) */}
          {q && totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} basePath={pagePattern} />
          )}
        </>
      )}
    </div>
  );
}
