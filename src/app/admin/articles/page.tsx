'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { fetchAdminJson, hasRowsWithId, isAbortError, isRecord, type AdminFetchErrorKind } from '@/lib/admin-fetch';
import { withBasePath } from '@/lib/site';
import { FIELD_SM, TABLE_WRAP, TD, TD_NUM, TH, TH_NUM, TR } from '@/lib/ui';
import { categoryLabel, cn, countryLabel, formatCount, getDisplayTitle, toLangTag } from '@/lib/utils';
import { COUNTRIES } from '@/lib/constants';
import AdminLoadError, { AdminLoading } from '@/components/AdminLoadError';
import { ActiveToggle, AdminPager } from '@/components/AdminParts';
import PageHeading from '@/components/PageHeading';

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
      alert('기사 상태를 바꾸지 못했습니다\n잠시 후 다시 시도하세요');
    }
  }

  const ready = load.status === 'ready';

  return (
    <div>
      {/* No count unless it was actually loaded */}
      <PageHeading title="기사 관리" count={ready ? total : null}>
        <label htmlFor="admin-article-status" className="sr-only">상태</label>
        <select
          id="admin-article-status"
          value={filter.status}
          onChange={(e) => { setFilter({ ...filter, status: e.target.value as StatusFilter }); setPage(1); }}
          className={FIELD_SM}
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
          className={FIELD_SM}
        >
          <option value="">전체 국가</option>
          {COUNTRIES.filter((c) => c.code !== 'all').map((c) => (
            <option key={c.code} value={c.code}>{c.label}</option>
          ))}
        </select>
      </PageHeading>

      {load.status === 'loading' && <AdminLoading />}
      {load.status === 'error' && (
        <AdminLoadError kind={load.kind} status={load.code} onRetry={() => loadArticles()} />
      )}

      {ready && (
        <>
          <div className={TABLE_WRAP} aria-busy={refreshing}>
            <table className="w-full text-body-md">
              <thead>
                <tr className="border-b border-border">
                  <th className={cn(TH_NUM, 'hidden sm:table-cell')}>ID</th>
                  <th className={TH}>제목</th>
                  <th className={TH}>소스</th>
                  <th className={cn(TH, 'hidden sm:table-cell')}>국가</th>
                  <th className={cn(TH, 'hidden sm:table-cell')}>카테고리</th>
                  <th className={TH_NUM}>조회</th>
                  <th className={TH}>상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted">
                {articles.map((article) => {
                  const t = getDisplayTitle(article);
                  return (
                    <tr key={article.id} className={TR}>
                      {/* An identifier, not a quantity: no thousands separator, muted */}
                      <td className={cn(TD_NUM, 'hidden sm:table-cell')}>
                        <span className="text-text-muted">{article.id}</span>
                      </td>
                      <td className={cn(TD, 'max-w-md')}>
                        <div className="flex min-w-0 items-baseline gap-2">
                          {article.isActive ? (
                            <Link href={`/article/${article.id}`} lang={t.lang} className="line-clamp-1 text-text underline-offset-4 hover:underline">
                              {t.text}
                            </Link>
                          ) : (
                            // Inactive articles are not public (their page is a 404)
                            <span lang={t.lang} className="line-clamp-1">{t.text}</span>
                          )}
                          {!t.isTranslated && toLangTag(article.language) !== 'ko' && (
                            <span className="flex-none text-caption text-text-muted">(미번역)</span>
                          )}
                        </div>
                      </td>
                      <td className={cn(TD, 'whitespace-nowrap')}>{article.source.sourceName}</td>
                      <td className={cn(TD, 'hidden sm:table-cell')}>{countryLabel(article.country)}</td>
                      <td className={cn(TD, 'hidden sm:table-cell')}>
                        {article.categoryPrimary ? categoryLabel(article.categoryPrimary) : '-'}
                      </td>
                      <td className={TD_NUM}>{formatCount(article.viewCount)}</td>
                      <td className={TD}>
                        <ActiveToggle
                          on={article.isActive}
                          label={`기사 ${article.id} ${article.isActive ? '비활성으로 전환' : '활성으로 전환'}`}
                          onToggle={() => toggleActive(article.id, article.isActive)}
                        />
                      </td>
                    </tr>
                  );
                })}
                {articles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="h-24 px-4 text-center text-text-muted">조건에 맞는 기사가 없습니다</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <AdminPager page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </div>
  );
}
