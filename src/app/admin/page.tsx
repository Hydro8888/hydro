'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAdminJson, isAbortError, isRecord, type AdminFetchErrorKind } from '@/lib/admin-fetch';
import { withBasePath } from '@/lib/site';
import { categoryLabel, countryLabel, formatDate } from '@/lib/utils';
import AdminLoadError, { AdminLoading } from '@/components/AdminLoadError';

interface Stats {
  totalArticles: number;
  articlesToday: number;
  activeSources: number;
  failedCollections: number;
  byCountry: Array<{ country: string; count: number }>;
  byCategory: Array<{ category: string; count: number }>;
  recentLogs: Array<{
    id: number;
    status: string;
    articlesFound: number;
    articlesNew: number;
    errorMessage: string | null;
    startedAt: string;
    source: { sourceName: string };
  }>;
}

/** Minimal guard: the numbers and lists the dashboard renders. */
function isStats(json: unknown): json is Stats {
  return (
    isRecord(json) &&
    typeof json.totalArticles === 'number' &&
    typeof json.articlesToday === 'number' &&
    typeof json.activeSources === 'number' &&
    typeof json.failedCollections === 'number' &&
    Array.isArray(json.byCountry) &&
    Array.isArray(json.byCategory) &&
    Array.isArray(json.recentLogs)
  );
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; stats: Stats }
  | { status: 'error'; kind: AdminFetchErrorKind; code?: number };

export default function AdminDashboard() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [collecting, setCollecting] = useState(false);
  const [fixing, setFixing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchAdminJson('/api/admin/stats', isStats, { signal: controller.signal })
      .then((r) => setState(r.ok ? { status: 'ready', stats: r.data } : { status: 'error', kind: r.kind, code: r.status }))
      .catch((err) => {
        if (!isAbortError(err)) setState({ status: 'error', kind: 'network' });
      });
    return () => controller.abort();
  }, [reloadKey]);

  async function triggerCollection() {
    setCollecting(true);
    try {
      const res = await fetch(withBasePath('/api/collect'), { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      alert('수집이 시작되었습니다');
    } catch {
      alert('수집 시작에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setCollecting(false);
    }
  }

  async function fixTranslations() {
    setFixing(true);
    try {
      const res = await fetch(withBasePath('/api/admin/fix-translations?titles=500&content=30'), {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      alert(data.message || '번역 보정이 완료되었습니다');
    } catch {
      alert('번역 보정에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setFixing(false);
    }
  }

  if (state.status !== 'ready') {
    return (
      <div>
        <h1 className="text-2xl font-bold text-text mb-8">관리자 대시보드</h1>
        {state.status === 'loading' ? (
          <AdminLoading />
        ) : (
          <AdminLoadError kind={state.kind} status={state.code} onRetry={() => setReloadKey((k) => k + 1)} />
        )}
      </div>
    );
  }

  const { stats } = state;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text">관리자 대시보드</h1>
        <div className="flex gap-2">
          <button
            onClick={fixTranslations}
            disabled={fixing}
            className="px-4 py-2 border border-accent text-accent rounded-lg hover:bg-accent/10 disabled:opacity-50"
            title="한글 번역이 누락된 기사 제목/요약/본문을 일괄 재번역합니다 (500건씩)"
          >
            {fixing ? '번역 보정 중...' : '미번역 보정'}
          </button>
          <button
            onClick={triggerCollection}
            disabled={collecting}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50"
          >
            {collecting ? '수집 중...' : '수동 수집 실행'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-card rounded-lg shadow-card p-6 border border-border">
          <p className="text-sm text-text-secondary">전체 기사</p>
          <p className="text-3xl font-bold text-accent">{stats.totalArticles.toLocaleString()}</p>
        </div>
        <div className="bg-surface-card rounded-lg shadow-card p-6 border border-border">
          <p className="text-sm text-text-secondary">오늘 수집</p>
          <p className="text-3xl font-bold text-accent-green">{stats.articlesToday.toLocaleString()}</p>
        </div>
        <div className="bg-surface-card rounded-lg shadow-card p-6 border border-border">
          <p className="text-sm text-text-secondary">활성 소스</p>
          <p className="text-3xl font-bold text-text">{stats.activeSources}</p>
        </div>
        <div className="bg-surface-card rounded-lg shadow-card p-6 border border-border">
          <p className="text-sm text-text-secondary">수집 실패</p>
          <p className="text-3xl font-bold text-accent-red">{stats.failedCollections}</p>
        </div>
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* By Country */}
        <div className="bg-surface-card rounded-lg shadow-card p-6 border border-border">
          <h2 className="font-bold mb-4 text-text">국가별 기사 수</h2>
          <div className="space-y-3">
            {stats.byCountry.map((item) => (
              <div key={item.country} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{countryLabel(item.country)}</span>
                <span className="text-sm font-medium text-text">{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Category */}
        <div className="bg-surface-card rounded-lg shadow-card p-6 border border-border">
          <h2 className="font-bold mb-4 text-text">카테고리별 기사 수</h2>
          <div className="space-y-3">
            {stats.byCategory.slice(0, 10).map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">{item.category ? categoryLabel(item.category) : '미분류'}</span>
                <span className="text-sm font-medium text-text">{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Collection Logs */}
      <div className="bg-surface-card rounded-lg shadow-card border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-text">최근 수집 로그</h2>
          <Link href="/admin/logs" className="text-sm text-accent hover:underline">
            전체 보기
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-elevated">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">소스</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">상태</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">발견</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">신규</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary">시간</th>
                <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">에러</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted">
              {stats.recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-elevated/50">
                  <td className="px-4 py-3 text-text">{log.source.sourceName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.status === 'success'
                          ? 'bg-accent-green/15 text-accent-green'
                          : log.status === 'failed'
                          ? 'bg-accent-red/15 text-accent-red'
                          : 'bg-accent/15 text-accent'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text hidden sm:table-cell">{log.articlesFound}</td>
                  <td className="px-4 py-3 font-medium text-text hidden sm:table-cell">{log.articlesNew}</td>
                  <td className="px-4 py-3 text-text-secondary tabular-nums">
                    {formatDate(log.startedAt) || '-'}
                  </td>
                  <td className="px-4 py-3 text-accent-red truncate max-w-xs hidden sm:table-cell">
                    {log.errorMessage || '-'}
                  </td>
                </tr>
              ))}
              {stats.recentLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    수집 로그가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
