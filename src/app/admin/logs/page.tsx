'use client';

import { useState, useEffect } from 'react';

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

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/livenews/api/admin/stats')
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.recentLogs || []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto"></div></div>;
  }

  if (error) {
    return <div className="text-center py-20 text-accent-red">로그를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.</div>;
  }

  const successCount = logs.filter((l) => l.status === 'success').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-text">수집 로그</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface-card rounded-lg shadow-card p-4 border border-border text-center">
          <p className="text-sm text-text-secondary">전체</p>
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

      <div className="bg-surface-card rounded-lg shadow-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">ID</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">소스</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">국가</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">상태</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">발견</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">신규</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">시작</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">완료</th>
              <th className="px-4 py-3 text-left font-medium text-text-secondary">에러</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-muted">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-surface-elevated/50">
                <td className="px-4 py-3 text-text-muted">{log.id}</td>
                <td className="px-4 py-3 font-medium text-text">{log.source.sourceName}</td>
                <td className="px-4 py-3 text-text-secondary">{log.source.country}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    log.status === 'success' ? 'bg-accent-green/15 text-accent-green' :
                    log.status === 'failed' ? 'bg-accent-red/15 text-accent-red' :
                    'bg-accent/15 text-accent'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-text">{log.articlesFound}</td>
                <td className="px-4 py-3 font-medium text-text">{log.articlesNew}</td>
                <td className="px-4 py-3 text-text-secondary">{new Date(log.startedAt).toLocaleString('ko-KR')}</td>
                <td className="px-4 py-3 text-text-secondary">{log.completedAt ? new Date(log.completedAt).toLocaleString('ko-KR') : '-'}</td>
                <td className="px-4 py-3 text-accent-red truncate max-w-xs">{log.errorMessage || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
