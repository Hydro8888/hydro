'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getStatusLabel, getCategoryLabel, getUrgencyLabel, formatCurrency, formatDate } from '@/lib/utils';

interface MessageItem {
  id: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
  sender: { name: string };
}

interface RequestDetail {
  id: string;
  title: string;
  description: string;
  naturalInput: string | null;
  category: string;
  urgency: string;
  status: string;
  budget: number | null;
  suggestedMin: number | null;
  suggestedMax: number | null;
  location: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  riskLevel: string | null;
  createdAt: string;
  updatedAt: string;
  requester: { id: string; name: string };
  helper: { id: string; name: string } | null;
  messages: MessageItem[];
  reviews: { id: string; rating: number; comment: string | null }[];
}

const STATUS_TIMELINE = ['PENDING', 'AI_REVIEWED', 'MATCHED', 'IN_PROGRESS', 'COMPLETED'];

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as { id?: string; role?: string } | undefined;

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState('');

  async function fetchRequest() {
    try {
      const res = await fetch(`/simburum/api/requests/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleStatusChange(newStatus: string) {
    setActionLoading(newStatus);
    try {
      const res = await fetch(`/simburum/api/requests/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchRequest();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading('');
    }
  }

  async function handleSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await fetch(`/simburum/api/requests/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });
      setMessage('');
      await fetchRequest();
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-20 card">
        <p className="text-gray-500">요청을 찾을 수 없습니다.</p>
        <Button onClick={() => router.push('/dashboard/requests')} variant="secondary" className="mt-4">
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const isRequester = user?.id === request.requester?.id;
  const isHelper = user?.id === request.helper?.id;
  const currentStatusIndex = STATUS_TIMELINE.indexOf(request.status);

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-50 text-primary-700">
              {getCategoryLabel(request.category)}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              request.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
              request.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700' :
              request.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
              'bg-gray-50 text-gray-700'
            }`}>
              {getStatusLabel(request.status)}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">진행 상태</h2>
        <div className="flex items-center gap-1">
          {STATUS_TIMELINE.map((status, i) => (
            <React.Fragment key={status}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= currentStatusIndex
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < currentStatusIndex ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">{getStatusLabel(status)}</span>
              </div>
              {i < STATUS_TIMELINE.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < currentStatusIndex ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card">
          <h2 className="font-bold text-gray-900 mb-3">요청 내용</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{request.description}</p>
        </div>

        <div className="card space-y-3">
          <h2 className="font-bold text-gray-900">상세 정보</h2>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">긴급도</span>
              <span className="font-medium">{getUrgencyLabel(request.urgency)}</span>
            </div>
            {request.budget && (
              <div className="flex justify-between">
                <span className="text-gray-500">예산</span>
                <span className="font-medium">{formatCurrency(request.budget)}</span>
              </div>
            )}
            {request.suggestedMin && request.suggestedMax && (
              <div className="flex justify-between">
                <span className="text-gray-500">AI 추천</span>
                <span className="font-medium text-xs">
                  {formatCurrency(request.suggestedMin)}~{formatCurrency(request.suggestedMax)}
                </span>
              </div>
            )}
            {request.location && (
              <div className="flex justify-between">
                <span className="text-gray-500">위치</span>
                <span className="font-medium">{request.location}</span>
              </div>
            )}
            {request.scheduledAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">희망일시</span>
                <span className="font-medium text-xs">{formatDate(new Date(request.scheduledAt))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">요청자</span>
              <span className="font-medium">{request.requester?.name}</span>
            </div>
            {request.helper && (
              <div className="flex justify-between">
                <span className="text-gray-500">헬퍼</span>
                <span className="font-medium">{request.helper.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">등록일</span>
              <span className="font-medium text-xs">{formatDate(new Date(request.createdAt))}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        {isHelper && request.status === 'MATCHED' && (
          <Button
            onClick={() => handleStatusChange('IN_PROGRESS')}
            loading={actionLoading === 'IN_PROGRESS'}
          >
            작업 시작
          </Button>
        )}
        {isHelper && request.status === 'IN_PROGRESS' && (
          <Button
            onClick={() => handleStatusChange('COMPLETED')}
            loading={actionLoading === 'COMPLETED'}
            variant="accent"
          >
            완료 처리
          </Button>
        )}
        {isRequester && (request.status === 'PENDING' || request.status === 'AI_REVIEWED') && (
          <Button
            onClick={() => handleStatusChange('CANCELLED')}
            loading={actionLoading === 'CANCELLED'}
            variant="danger"
          >
            요청 취소
          </Button>
        )}
        {isRequester && request.status === 'COMPLETED' && request.reviews.length === 0 && (
          <Button
            onClick={() => router.push(`/dashboard/reviews?requestId=${request.id}`)}
            variant="accent"
          >
            리뷰 작성
          </Button>
        )}
      </div>

      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">메시지</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
          {request.messages.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">아직 메시지가 없습니다.</p>
          ) : (
            request.messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${
                  msg.senderId === user?.id
                    ? 'bg-primary-50 ml-8'
                    : msg.type === 'SYSTEM'
                    ? 'bg-gray-100 text-center'
                    : 'bg-gray-50 mr-8'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{msg.sender?.name}</span>
                  <span className="text-xs text-gray-400">{formatDate(new Date(msg.createdAt))}</span>
                </div>
                <p className="text-sm text-gray-700">{msg.content}</p>
              </div>
            ))
          )}
        </div>

        {request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              type="text"
              placeholder="메시지를 입력하세요..."
              value={message}
              onChange={(e) => setMessage((e.target as HTMLInputElement).value)}
            />
            <Button type="submit" disabled={!message.trim()}>
              전송
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
