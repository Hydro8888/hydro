'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import { getCategoryLabel, getUrgencyLabel, formatCurrency } from '@/lib/utils';

interface MatchRequest {
  id: string;
  title: string;
  category: string;
  urgency: string;
  budget: number | null;
  location: string | null;
  requester: { name: string };
}

interface HelperMatch {
  helperId: string;
  score: number;
  reasons: string[];
  helper: {
    id: string;
    name: string;
    helperProfile: {
      avgRating: number;
      completedCount: number;
      onTimeRate: number;
      categories: string;
    } | null;
  };
}

export default function MatchingPage() {
  const { data: session } = useSession();
  const user = session?.user as { role?: string } | undefined;

  const [pendingRequests, setPendingRequests] = useState<MatchRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [helpers, setHelpers] = useState<HelperMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState('');

  useEffect(() => {
    async function fetchPending() {
      try {
        const res = await fetch('/simburum/api/requests?status=AI_REVIEWED');
        const data = await res.json();
        setPendingRequests(Array.isArray(data) ? data : data.requests || []);
      } catch {
        setPendingRequests([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPending();
  }, []);

  async function handleFindHelpers(requestId: string) {
    setSelectedRequest(requestId);
    setMatchLoading(true);
    try {
      const res = await fetch('/simburum/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      setHelpers(data.matches || []);
    } catch {
      setHelpers([]);
    } finally {
      setMatchLoading(false);
    }
  }

  async function handleAccept(requestId: string, helperId: string) {
    setAcceptLoading(helperId);
    try {
      await fetch('/simburum/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, helperId }),
      });
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      setSelectedRequest(null);
      setHelpers([]);
    } catch {
      // ignore
    } finally {
      setAcceptLoading('');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">매칭</h1>
      <p className="text-gray-600 mb-8">
        {user?.role === 'HELPER'
          ? '수락 가능한 요청을 확인하세요.'
          : 'AI 매칭을 통해 최적의 헬퍼를 찾아보세요.'}
      </p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="text-center py-20 card">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <p className="text-gray-500">현재 매칭 대기 중인 요청이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingRequests.map((req) => (
            <div key={req.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">
                      {getCategoryLabel(req.category)}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                      {getUrgencyLabel(req.urgency)}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{req.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>요청자: {req.requester?.name}</span>
                    {req.budget && <span>{formatCurrency(req.budget)}</span>}
                    {req.location && <span>{req.location}</span>}
                  </div>
                </div>
                <Button
                  onClick={() => handleFindHelpers(req.id)}
                  loading={matchLoading && selectedRequest === req.id}
                  variant="accent"
                  size="sm"
                >
                  AI 매칭
                </Button>
              </div>

              {selectedRequest === req.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {matchLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-4 border-accent-200 border-t-accent-600 rounded-full animate-spin" />
                    </div>
                  ) : helpers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">매칭 가능한 헬퍼가 없습니다.</p>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700">추천 헬퍼</h4>
                      {helpers.map((match) => (
                        <div key={match.helperId} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{match.helper?.name || match.helperId}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 font-medium">
                                점수: {match.score}
                              </span>
                            </div>
                            {match.helper?.helperProfile && (
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>평점: {match.helper.helperProfile.avgRating.toFixed(1)}</span>
                                <span>완료: {match.helper.helperProfile.completedCount}건</span>
                                <span>정시율: {match.helper.helperProfile.onTimeRate}%</span>
                              </div>
                            )}
                            {match.reasons.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">{match.reasons.join(' / ')}</p>
                            )}
                          </div>
                          <Button
                            onClick={() => handleAccept(req.id, match.helperId)}
                            loading={acceptLoading === match.helperId}
                            size="sm"
                          >
                            수락
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
