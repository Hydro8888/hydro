'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStatusLabel, getCategoryLabel, formatCurrency, formatDate } from '@/lib/utils';

interface RequestItem {
  id: string;
  title: string;
  category: string;
  status: string;
  urgency: string;
  budget: number | null;
  location: string | null;
  createdAt: string;
}

const STATUS_TABS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: '대기 중' },
  { value: 'AI_REVIEWED', label: 'AI 검토' },
  { value: 'MATCHED', label: '매칭 완료' },
  { value: 'IN_PROGRESS', label: '진행 중' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '취소' },
];

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter) params.set('status', statusFilter);
        const res = await fetch(`/simburum/api/requests?${params}`);
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : data.requests || []);
      } catch {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, [statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">내 요청</h1>
        <Link href="/dashboard/requests/new" className="btn-primary text-sm py-2 px-4">
          새 요청
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 card">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0h3.75m-3.75 3H9.75m0 0H6m6 0v3.375c0 .621-.504 1.125-1.125 1.125h-.375m-6-3.75h4.5" />
          </svg>
          <p className="text-gray-500 mb-4">요청이 없습니다.</p>
          <Link href="/dashboard/requests/new" className="btn-primary text-sm py-2 px-4">
            첫 요청 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Link
              key={req.id}
              href={`/dashboard/requests/${req.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                      {getCategoryLabel(req.category)}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      req.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                      req.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' :
                      req.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                      req.status === 'MATCHED' ? 'bg-purple-50 text-purple-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      {getStatusLabel(req.status)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{req.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    {req.budget && <span>{formatCurrency(req.budget)}</span>}
                    {req.location && <span>{req.location}</span>}
                    <span>{formatDate(new Date(req.createdAt))}</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
