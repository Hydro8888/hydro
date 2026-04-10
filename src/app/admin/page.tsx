'use client';

import React, { useEffect, useState } from 'react';

interface AdminStats {
  totalUsers: number;
  totalHelpers: number;
  totalRequests: number;
  requestsToday: number;
  completedRequests: number;
  cancelledRequests: number;
  matchingRate: number;
  cancelRate: number;
  avgMatchingTime: string;
  totalReviews: number;
  avgRating: number;
  totalReports: number;
  pendingReports: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/simburum/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-center text-gray-500 py-20">통계를 불러올 수 없습니다.</p>;
  }

  const CARDS = [
    { label: '총 사용자', value: stats.totalUsers, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '헬퍼 수', value: stats.totalHelpers, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '총 요청', value: stats.totalRequests, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '오늘 요청', value: stats.requestsToday, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '완료된 요청', value: stats.completedRequests, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: '취소된 요청', value: stats.cancelledRequests, color: 'text-red-600', bg: 'bg-red-50' },
    { label: '매칭률', value: `${stats.matchingRate.toFixed(1)}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '취소율', value: `${stats.cancelRate.toFixed(1)}%`, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: '평균 매칭 시간', value: stats.avgMatchingTime, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: '총 리뷰', value: stats.totalReviews, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: '평균 평점', value: stats.avgRating.toFixed(1), color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '미처리 신고', value: stats.pendingReports, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">관리자 통계 대시보드</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {CARDS.map((card) => (
          <div key={card.label} className="card">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
            <p className={`text-2xl font-bold mt-2 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
