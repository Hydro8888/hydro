'use client';

import { useState, useEffect } from 'react';
import { fetchAdminJson, hasRowsWithId, isAbortError, isRecord, type AdminFetchErrorKind } from '@/lib/admin-fetch';
import { FIELD_SM, TABLE_WRAP, TD, TD_MAIN, TD_NUM, TD_TIME, TH, TH_NUM, TR } from '@/lib/ui';
import { cn, countryLabel, formatCount, formatDate } from '@/lib/utils';
import AdminLoadError, { AdminLoading } from '@/components/AdminLoadError';
import { AdminPager, AdminStat, LogStatus } from '@/components/AdminParts';
import PageHeading from '@/components/PageHeading';

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
  // What the two figures are counted over: the rows on this page
  const pageBasis = `${formatCount(logs.length)}건 중`;

  return (
    <div>
      {/* No count unless it was actually loaded */}
      <PageHeading title="수집 로그" count={load.status === 'ready' ? total : null}>
        <label htmlFor="admin-log-status" className="sr-only">상태</label>
        <select
          id="admin-log-status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className={FIELD_SM}
        >
          <option value="">전체 상태</option>
          <option value="success">성공</option>
          <option value="failed">실패</option>
          <option value="partial">부분</option>
        </select>
      </PageHeading>

      {/* The success / failure figures count the rows of this page, and say so. */}
      {load.status === 'ready' && (
        <dl className="mb-6 grid grid-cols-3 gap-4">
          <AdminStat label="이 페이지" value={logs.length} basis={`전체 ${formatCount(total)}건 중`} />
          <AdminStat label="성공" value={successCount} basis={pageBasis} />
          <AdminStat label="실패" value={failedCount} basis={pageBasis} alert={failedCount > 0} />
        </dl>
      )}

      {load.status === 'error' ? (
        <AdminLoadError kind={load.kind} status={load.code} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : load.status === 'loading' ? (
        <AdminLoading />
      ) : (
        <>
          <div className={TABLE_WRAP}>
            <table className="w-full text-body-md">
              <thead>
                <tr className="border-b border-border">
                  <th className={TH_NUM}>ID</th>
                  <th className={TH}>소스</th>
                  <th className={cn(TH, 'hidden sm:table-cell')}>국가</th>
                  <th className={TH}>상태</th>
                  <th className={cn(TH_NUM, 'hidden sm:table-cell')}>발견</th>
                  <th className={cn(TH_NUM, 'hidden sm:table-cell')}>신규</th>
                  <th className={TH}>시작</th>
                  <th className={cn(TH, 'hidden sm:table-cell')}>완료</th>
                  <th className={cn(TH, 'hidden sm:table-cell')}>오류</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-muted">
                {logs.map((log) => (
                  <tr key={log.id} className={TR}>
                    {/* An identifier, not a quantity: no thousands separator, muted */}
                    <td className={TD_NUM}>
                      <span className="text-text-muted">{log.id}</span>
                    </td>
                    <td className={cn(TD_MAIN, 'whitespace-nowrap')}>{log.source.sourceName}</td>
                    <td className={cn(TD, 'hidden sm:table-cell')}>{countryLabel(log.source.country)}</td>
                    <td className={TD}>
                      <LogStatus log={log} />
                    </td>
                    <td className={cn(TD_NUM, 'hidden sm:table-cell')}>{formatCount(log.articlesFound)}</td>
                    <td className={cn(TD_NUM, 'hidden sm:table-cell')}>{formatCount(log.articlesNew)}</td>
                    <td className={TD_TIME}>{formatDate(log.startedAt) || '-'}</td>
                    <td className={cn(TD_TIME, 'hidden sm:table-cell')}>{formatDate(log.completedAt) || '-'}</td>
                    <td className={cn(TD, 'hidden max-w-xs truncate sm:table-cell')} title={log.errorMessage ?? undefined}>
                      {log.errorMessage ? <span className="text-negative">{log.errorMessage}</span> : '-'}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="h-24 px-4 text-center text-text-muted">수집 로그가 없습니다</td>
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
