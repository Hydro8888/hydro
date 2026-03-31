'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalArticles: number;
  articlesToday: number;
  activeSources: number;
  failedCollections: number;
  byCountry: Array<{ country: string; _count: number }>;
  byCategory: Array<{ categoryPrimary: string; _count: number }>;
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    fetch('/livenews/api/admin/stats')
      .then((r) => r.json())
      .then(setStats);
  }, []);

  async function triggerCollection() {
    setCollecting(true);
    try {
      await fetch('/livenews/api/collect', { method: 'POST' });
      alert('수집이 시작되었습니다');
    } catch {
      alert('수집 시작 실패');
    }
    setCollecting(false);
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <button
          onClick={triggerCollection}
          disabled={collecting}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {collecting ? '수집 중...' : '수동 수집 실행'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500">전체 기사</p>
          <p className="text-3xl font-bold text-primary">{stats.totalArticles.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500">오늘 수집</p>
          <p className="text-3xl font-bold text-green-600">{stats.articlesToday.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500">활성 소스</p>
          <p className="text-3xl font-bold">{stats.activeSources}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <p className="text-sm text-gray-500">수집 실패</p>
          <p className="text-3xl font-bold text-red-600">{stats.failedCollections}</p>
        </div>
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* By Country */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="font-bold mb-4">국가별 기사 수</h2>
          <div className="space-y-3">
            {stats.byCountry.map((item) => (
              <div key={item.country} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.country}</span>
                <span className="text-sm font-medium">{item._count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Category */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="font-bold mb-4">카테고리별 기사 수</h2>
          <div className="space-y-3">
            {stats.byCategory.slice(0, 10).map((item) => (
              <div key={item.categoryPrimary} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.categoryPrimary || '미분류'}</span>
                <span className="text-sm font-medium">{item._count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Collection Logs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-bold">최근 수집 로그</h2>
          <Link href="/admin/logs" className="text-sm text-primary hover:underline">
            전체 보기
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">소스</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">상태</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">발견</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">신규</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">시간</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">에러</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{log.source.sourceName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : log.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">{log.articlesFound}</td>
                  <td className="px-4 py-3 font-medium hidden sm:table-cell">{log.articlesNew}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(log.startedAt).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-red-500 truncate max-w-xs hidden sm:table-cell">
                    {log.errorMessage || '-'}
                  </td>
                </tr>
              ))}
              {stats.recentLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
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
