'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';

interface ReviewItem {
  id: string;
  requestId: string;
  rating: number;
  punctuality: number | null;
  accuracy: number | null;
  kindness: number | null;
  comment: string | null;
  createdAt: string;
  author: { id: string; name: string };
  target: { id: string; name: string };
  request: { title: string };
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="focus:outline-none"
        >
          <svg
            className={`w-7 h-7 ${i <= value ? 'text-yellow-400' : 'text-gray-200'} hover:text-yellow-300 transition-colors`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm font-medium text-gray-700 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ReviewsPage() {
  const { data: session } = useSession();
  const user = session?.user as { id?: string } | undefined;
  const searchParams = useSearchParams();
  const requestIdParam = searchParams.get('requestId');

  const [tab, setTab] = useState<'received' | 'given'>('received');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(!!requestIdParam);
  const [reviewForm, setReviewForm] = useState({
    requestId: requestIdParam || '',
    rating: 5,
    punctuality: 5,
    accuracy: 5,
    kindness: 5,
    comment: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        const res = await fetch('/simburum/api/reviews');
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : data.reviews || []);
      } catch {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [formSuccess]);

  const received = reviews.filter((r) => r.target?.id === user?.id);
  const given = reviews.filter((r) => r.author?.id === user?.id);
  const displayReviews = tab === 'received' ? received : given;

  async function handleSubmitReview(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/simburum/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || '리뷰 작성에 실패했습니다.');
        return;
      }
      setFormSuccess(true);
      setShowForm(false);
    } catch {
      setFormError('리뷰 작성 중 오류가 발생했습니다.');
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">리뷰</h1>
      <p className="text-gray-600 mb-8">받은 리뷰와 작성한 리뷰를 확인하세요.</p>

      {showForm && (
        <div className="card mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">리뷰 작성</h2>
          <form onSubmit={handleSubmitReview} className="space-y-5">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {formError}
              </div>
            )}

            <Input
              label="요청 ID"
              type="text"
              value={reviewForm.requestId}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, requestId: (e.target as HTMLInputElement).value }))}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">총점</label>
              <StarInput value={reviewForm.rating} onChange={(v) => setReviewForm((prev) => ({ ...prev, rating: v }))} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시간 준수</label>
                <StarInput value={reviewForm.punctuality} onChange={(v) => setReviewForm((prev) => ({ ...prev, punctuality: v }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정확도</label>
                <StarInput value={reviewForm.accuracy} onChange={(v) => setReviewForm((prev) => ({ ...prev, accuracy: v }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">친절도</label>
                <StarInput value={reviewForm.kindness} onChange={(v) => setReviewForm((prev) => ({ ...prev, kindness: v }))} />
              </div>
            </div>

            <Input
              as="textarea"
              label="코멘트"
              placeholder="서비스에 대한 소감을 남겨주세요."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: (e.target as HTMLTextAreaElement).value }))}
              rows={3}
            />

            <div className="flex gap-3">
              <Button type="submit" loading={formLoading}>리뷰 등록</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>취소</Button>
            </div>
          </form>
        </div>
      )}

      {formSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 mb-6">
          리뷰가 성공적으로 등록되었습니다.
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('received')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'received' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          받은 리뷰 ({received.length})
        </button>
        <button
          onClick={() => setTab('given')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'given' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          작성한 리뷰 ({given.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : displayReviews.length === 0 ? (
        <div className="text-center py-20 card">
          <p className="text-gray-500">{tab === 'received' ? '아직 받은 리뷰가 없습니다.' : '아직 작성한 리뷰가 없습니다.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayReviews.map((review) => (
            <div key={review.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {tab === 'received' ? review.author?.name : review.target?.name}
                  </span>
                  <StarDisplay rating={review.rating} />
                </div>
                <span className="text-xs text-gray-500">{formatDate(new Date(review.createdAt))}</span>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {review.punctuality && <span>시간 준수: {review.punctuality}/5</span>}
                {review.accuracy && <span>정확도: {review.accuracy}/5</span>}
                {review.kindness && <span>친절도: {review.kindness}/5</span>}
              </div>
              <p className="text-xs text-gray-400 mt-2">요청: {review.request?.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
