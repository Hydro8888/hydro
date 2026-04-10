'use client';

import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { getCategoryLabel, getUrgencyLabel, formatDate } from '@/lib/utils';

interface FlaggedRequest {
  id: string;
  title: string;
  description: string;
  naturalInput: string | null;
  category: string;
  urgency: string;
  status: string;
  riskLevel: string | null;
  aiCategory: string | null;
  aiConfidence: number | null;
  createdAt: string;
  requester: { name: string; email: string };
}

export default function AIQueuePage() {
  const [requests, setRequests] = useState<FlaggedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  async function fetchFlagged() {
    try {
      const res = await fetch('/simburum/api/requests?riskLevel=HIGH&status=PENDING');
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : data.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFlagged();
  }, []);

  async function handleAction(requestId: string, action: 'approve' | 'reject') {
    setActionLoading(requestId);
    try {
      const newStatus = action === 'approve' ? 'AI_REVIEWED' : 'CANCELLED';
      await fetch(`/simburum/api/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchFlagged();
    } catch {
      // ignore
    } finally {
      setActionLoading('');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">AI 검토 대기</h1>
      <p className="text-gray-600 mb-8">위험도가 높은 요청을 수동으로 검토합니다.</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 card">
          <svg className="w-16 h-16 mx-auto text-green-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500">검토 대기 중인 요청이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => (
            <div key={req.id} className="card border-l-4 border-red-400">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">
                      HIGH RISK
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                      {getCategoryLabel(req.category)}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                      {getUrgencyLabel(req.urgency)}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{req.title}</h3>
                </div>
                <span className="text-xs text-gray-500">{formatDate(new Date(req.createdAt))}</span>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">요청 내용</h4>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                  {req.description}
                </p>
              </div>

              {req.naturalInput && req.naturalInput !== req.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">원본 입력</h4>
                  <p className="text-sm text-gray-600 leading-relaxed bg-yellow-50 p-3 rounded-lg">
                    {req.naturalInput}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>요청자: {req.requester?.name} ({req.requester?.email})</span>
                {req.aiConfidence && (
                  <span>AI 신뢰도: {(req.aiConfidence * 100).toFixed(0)}%</span>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => handleAction(req.id, 'approve')}
                  loading={actionLoading === req.id}
                  variant="primary"
                  size="sm"
                >
                  승인
                </Button>
                <Button
                  onClick={() => handleAction(req.id, 'reject')}
                  loading={actionLoading === req.id}
                  variant="danger"
                  size="sm"
                >
                  거부
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
