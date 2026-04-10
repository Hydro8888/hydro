'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatDate, getStatusLabel, getCategoryLabel, formatCurrency } from '@/lib/utils';

interface RequestItem {
  id: string;
  title: string;
  category: string;
  status: string;
  budget: number | null;
  createdAt: string;
}

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { name: string };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string; id?: string; role?: string } | undefined;

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState({
    inProgress: 0,
    completed: 0,
    avgRating: 0,
    trustScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [reqRes, revRes] = await Promise.all([
          fetch('/simburum/api/requests'),
          fetch('/simburum/api/reviews'),
        ]);
        const reqData = await reqRes.json();
        const revData = await revRes.json();

        const reqs: RequestItem[] = Array.isArray(reqData) ? reqData : reqData.requests || [];
        const revs: ReviewItem[] = Array.isArray(revData) ? revData : revData.reviews || [];

        setRequests(reqs.slice(0, 5));
        setReviews(revs.slice(0, 5));

        const inProgress = reqs.filter(
          (r: RequestItem) => r.status === 'IN_PROGRESS' || r.status === 'MATCHED'
        ).length;
        const completed = reqs.filter((r: RequestItem) => r.status === 'COMPLETED').length;
        const ratings = revs.map((r: ReviewItem) => r.rating);
        const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;

        setStats({ inProgress, completed, avgRating, trustScore: avgRating * 20 });
      } catch {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const STAT_CARDS = [
    { label: '진행 중 요청', value: stats.inProgress, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '완료된 요청', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '평균 평점', value: stats.avgRating.toFixed(1), color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: '신뢰 점수', value: Math.round(stats.trustScore), color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          안녕하세요, {user?.name ?? '사용자'}님!
        </h1>
        <p className="text-gray-600 mt-1">오늘도 심부름과 함께 편리한 하루 보내세요.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STAT_CARDS.map((card) => (
              <div key={card.label} className="card">
                <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <span className={`text-lg font-bold ${card.color}`}>#</span>
                </div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color} mt-1`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">최근 요청</h2>
                <Link href="/dashboard/requests" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  전체 보기
                </Link>
              </div>
              {requests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-4">아직 요청이 없습니다.</p>
                  <Link href="/dashboard/requests/new" className="btn-primary text-sm py-2 px-4">
                    첫 요청 만들기
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <Link
                      key={req.id}
                      href={`/dashboard/requests/${req.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{req.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{getCategoryLabel(req.category)}</span>
                          {req.budget && (
                            <span className="text-xs text-gray-500">{formatCurrency(req.budget)}</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        req.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                        req.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' :
                        req.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>
                        {getStatusLabel(req.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">최근 리뷰</h2>
                <Link href="/dashboard/reviews" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  전체 보기
                </Link>
              </div>
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">아직 받은 리뷰가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{rev.author?.name}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <svg
                              key={i}
                              className={`w-3.5 h-3.5 ${i <= Math.round(rev.rating) ? 'text-yellow-400' : 'text-gray-200'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-sm text-gray-600">{rev.comment}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatDate(new Date(rev.createdAt))}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
