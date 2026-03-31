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

  useEffect(() => {
    fetch('/livenews/api/admin/stats')
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.recentLogs || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div></div>;
  }

  const successCount = logs.filter((l) => l.status === 'success').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">수집 로그</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-center">
          <p className="text-sm text-gray-500">전체</p>
          <p className="text-2xl font-bold">{logs.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-center">
          <p className="text-sm text-gray-500">성공</p>
          <p className="text-2xl font-bold text-green-600">{successCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 text-center">
          <p className="text-sm text-gray-500">실패</p>
          <p className="text-2xl font-bold text-red-600">{failedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">소스</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">국가</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">상태</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">발견</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">신규</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">시작</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">완료</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">에러</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{log.id}</td>
                <td className="px-4 py-3 font-medium">{log.source.sourceName}</td>
                <td className="px-4 py-3">{log.source.country}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    log.status === 'success' ? 'bg-green-100 text-green-800' :
                    log.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-3">{log.articlesFound}</td>
                <td className="px-4 py-3 font-medium">{log.articlesNew}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(log.startedAt).toLocaleString('ko-KR')}</td>
                <td className="px-4 py-3 text-gray-500">{log.completedAt ? new Date(log.completedAt).toLocaleString('ko-KR') : '-'}</td>
                <td className="px-4 py-3 text-red-500 truncate max-w-xs">{log.errorMessage || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
