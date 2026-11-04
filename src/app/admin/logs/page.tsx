'use client';

import { useState, useEffect } from 'react';
import { fetchAdminJson, hasRowsWithId, isAbortError, isRecord, type AdminFetchErrorKind } from '@/lib/admin-fetch';
import { formatDate } from '@/lib/utils';
import AdminLoadError, { AdminLoading } from '@/components/AdminLoadError';

interface Log {
  id: number;
  sourceId: number;
  status: string;
  articlesFound: number;
  articlesNew: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  source: { sourceName: string; country: string };
}

interface LogsPayload {
  logs: Log[];
  total: number;
  totalPages: number;
}

const isLogsPayload = (json: unknown): json is LogsPayload =>
  hasRowsWithId(json, 'logs') && isRecord(json) && typeof json.total === 'number' && typeof json.totalPages === 'number';

type LoadState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; kind: AdminFetchErrorKind; code?: number };

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoad({ status: 'loading' });
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (statusFilter) params.set('status', statusFilter);

    fetchAdminJson(`/api/admin/logs?${params}`, isLogsPayload, { signal: controller.signal })
      .then((r) => {
        if (r.ok) {
          setLogs(r.data.logs);
          setTotal(r.data.total);
          setTotalPages(r.data.totalPages);
          setLoad({ status: 'ready' });
        } else {
          setLoad({ status: 'error', kind: r.kind, code: r.status });
        }
      })
      .catch((err) => {
        if (!isAbortError(err)) setLoad({ status: 'error', kind: 'network' });
      });
    return () => controller.abort();
  }, [page, statusFilter, reloadKey]);

  const successCount = logs.filter((l) => l.status === 'success').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">{load.status === 'ready' ? `수집 로그 (${total})` : '수집 로그'}</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm bg-surface border border-border text-text rounded px-2 py-1 focus:border-accent focus:outline-none"
        >
          <option value="">전체 상태</option>
          <option value="success">성공</option>
          <option value="failed">실패</option>
          <option value="partial">부분</option>
        </select>
      </div>

      {load.status === 'ready' && (
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-card rounded-lg shadow-card p-4 border border-border text-center">
          <p className="text-sm text-text-secondary">이 페이지</p>
          <p className="text-2xl font-bold text-text">{logs.length}</p>
        </div>
        <div className="bg-surface-card rounded-lg shadow-card p-4 border border-border text-center">
          <p className="text-sm text-text-secondary">성공</p>
          <p className="text-2xl font-bold text-accent-green">{successCount}</p>
        </div>
        <div className="bg-surface-card rounded-lg shadow-card p-4 border border-border text-center">
          <p className="text-sm text-text-secondary">실패</p>
          <p className="text-2xl font-bold text-accent-red">{failedCount}</p>
        </div>
      </div>
      )}

      {load.status === 'error' ? (
        <AdminLoadError kind={load.kind} status={load.code} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : load.status === 'loading' ? (
        <AdminLoading />
      ) : (
        <>
          <div className="bg-surface-card rounded-lg shadow-card border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-elevated">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">ID</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">소스</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">국가</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">상태</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">발견</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">신규</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">시작</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">완료</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary hidden sm:table-cell">에러</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-elevated/50">
                    <td className="px-4 py-3 text-text-muted">{log.id}</td>
                    <td className="px-4 py-3 font-medium text-text">{log.source.sourceName}</td>
                    <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">{log.source.country}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.status === 'success' ? 'bg-accent-green/15 text-accent-green' :
                        log.status === 'failed' ? 'bg-accent-red/15 text-accent-red' :
                        'bg-accent/15 text-accent'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text hidden sm:table-cell">{log.articlesFound}</td>
                    <td className="px-4 py-3 font-medium text-text hidden sm:table-cell">{log.articlesNew}</td>
                    <td className="px-4 py-3 text-text-secondary tabular-nums">{formatDate(log.startedAt) || '-'}</td>
                    <td className="px-4 py-3 text-text-secondary tabular-nums hidden sm:table-cell">{formatDate(log.completedAt) || '-'}</td>
                    <td className="px-4 py-3 text-accent-red truncate max-w-xs hidden sm:table-cell">{log.errorMessage || '-'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-text-muted">수집 로그가 없습니다</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 border border-border text-text rounded hover:bg-surface-elevated disabled:opacity-50"
            >
              이전
            </button>
            <span className="px-4 py-2 text-sm text-text-secondary">
              {page} / {totalPages || 1}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border border-border text-text rounded hover:bg-surface-elevated disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}
