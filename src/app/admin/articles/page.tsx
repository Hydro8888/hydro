'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { fetchAdminJson, hasRowsWithId, isAbortError, isRecord, type AdminFetchErrorKind } from '@/lib/admin-fetch';
import { withBasePath } from '@/lib/site';
import { getDisplayTitle, toLangTag } from '@/lib/utils';
import AdminLoadError, { AdminLoading } from '@/components/AdminLoadError';

interface Article {
  id: number;
  titleOriginal: string;
  titleKo: string | null;
  language: string | null;
  country: string;
  categoryPrimary: string | null;
  publishedAt: string | null;
  isActive: boolean;
  viewCount: number;
  source: { sourceName: string };
}

interface ArticlesPayload {
  articles: Article[];
  total: number;
  page: number;
  totalPages: number;
}

const PAGE_SIZE = 30;

const isArticlesPayload = (json: unknown): json is ArticlesPayload =>
  hasRowsWithId(json, 'articles') &&
  isRecord(json) &&
  typeof json.total === 'number' &&
  typeof json.totalPages === 'number';

type StatusFilter = 'all' | 'active' | 'inactive';
type LoadState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; kind: AdminFetchErrorKind; code?: number };

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<{ country: string; status: StatusFilter }>({ country: '', status: 'all' });
  const controllerRef = useRef<AbortController | null>(null);

  /**
   * Admin list endpoint (includes inactive articles, so they can be re-activated).
   * `quiet` keeps the table visible while refreshing after a change.
   */
  const loadArticles = useCallback(
    async (quiet = false) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      if (quiet) setRefreshing(true);
      else setLoad({ status: 'loading' });
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), status: filter.status });
      if (filter.country) params.set('country', filter.country);
      try {
        const r = await fetchAdminJson(`/api/admin/articles?${params}`, isArticlesPayload, { signal: controller.signal });
        if (r.ok) {
          setArticles(r.data.articles);
          setTotal(r.data.total);
          setTotalPages(r.data.totalPages);
          setLoad({ status: 'ready' });
        } else {
          setLoad({ status: 'error', kind: r.kind, code: r.status });
        }
      } catch (err) {
        if (isAbortError(err)) return;
        setLoad({ status: 'error', kind: 'network' });
      }
      if (controllerRef.current === controller) setRefreshing(false);
    },
    [page, filter],
  );

  useEffect(() => {
    loadArticles();
    return () => controllerRef.current?.abort();
  }, [loadArticles]);

  async function toggleActive(id: number, isActive: boolean) {
    // Optimistic update for instant feedback
    setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: !isActive } : a)));
    try {
      const res = await fetch(withBasePath(`/api/articles/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      loadArticles(true);
    } catch {
      // Roll back optimistic change and notify
      setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, isActive } : a)));
      alert('상태 변경에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  const ready = load.status === 'ready';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* No "(0)" unless the count was actually loaded */}
        <h1 className="text-2xl font-bold text-text">{ready ? `기사 관리 (${total})` : '기사 관리'}</h1>
        <div className="flex gap-2">
          <label htmlFor="admin-article-status" className="sr-only">상태</label>
          <select
            id="admin-article-status"
            value={filter.status}
            onChange={(e) => { setFilter({ ...filter, status: e.target.value as StatusFilter }); setPage(1); }}
            className="text-sm bg-surface border border-border text-text rounded px-2 py-1 focus:border-accent focus:outline-none"
          >
            <option value="all">전체 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
          <label htmlFor="admin-article-country" className="sr-only">국가</label>
          <select
            id="admin-article-country"
            value={filter.country}
            onChange={(e) => { setFilter({ ...filter, country: e.target.value }); setPage(1); }}
            className="text-sm bg-surface border border-border text-text rounded px-2 py-1 focus:border-accent focus:outline-none"
          >
            <option value="">전체 국가</option>
            <option value="global">글로벌</option>
            <option value="us">미국</option>
            <option value="japan">일본</option>
            <option value="china">중국</option>
          </select>
        </div>
      </div>

      {load.status === 'loading' && <AdminLoading />}
      {load.status === 'error' && (
        <AdminLoadError kind={load.kind} status={load.code} onRetry={() => loadArticles()} />
      )}

      {ready && (
        <>
          <div className="bg-surface-card rounded-lg shadow-card border border-border overflow-x-auto" aria-busy={refreshing}>
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">제목</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">소스</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">국가</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">카테고리</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">조회</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted">
                {articles.map((article) => {
                  const t = getDisplayTitle(article);
                  return (
                    <tr key={article.id} className="hover:bg-surface-elevated/50">
                      <td className="px-4 py-3 text-text-muted tabular-nums hidden sm:table-cell">{article.id}</td>
                      <td className="px-4 py-3 max-w-md">
                        <div className="flex items-baseline gap-1.5 min-w-0">
                          {article.isActive ? (
                            <Link href={`/article/${article.id}`} lang={t.lang} className="text-text hover:text-accent line-clamp-1">
                              {t.text}
                            </Link>
                          ) : (
                            // Inactive articles are not public (their page is a 404)
                            <span lang={t.lang} className="text-text-secondary line-clamp-1">{t.text}</span>
                          )}
                          {!t.isTranslated && toLangTag(article.language) !== 'ko' && (
                            <span className="flex-none text-caption text-text-muted">(미번역)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{article.source.sourceName}</td>
                      <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{article.country}</td>
                      <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">
                        {article.categoryPrimary || '-'}
                      </td>
                      <td className="px-4 py-3 text-text tabular-nums">{article.viewCount}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleActive(article.id, article.isActive)}
                          aria-label={`기사 ${article.id} ${article.isActive ? '비활성으로 전환' : '활성으로 전환'}`}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${article.isActive ? 'bg-accent-green/15 text-accent-green' : 'bg-accent-red/15 text-accent-red'}`}
                        >
                          {article.isActive ? '활성' : '비활성'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {articles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text-muted">조건에 맞는 기사가 없습니다</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-6">
            <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 border border-border text-text rounded hover:bg-surface-elevated disabled:opacity-50">이전</button>
            <span className="px-4 py-2 text-sm text-text-secondary tabular-nums">{page} / {Math.max(1, totalPages)}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 border border-border text-text rounded hover:bg-surface-elevated disabled:opacity-50">다음</button>
          </div>
        </>
      )}
    </div>
  );
}
