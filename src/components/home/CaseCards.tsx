'use client';

import React from 'react';
import Link from 'next/link';

interface CaseCardData {
  id: string;
  category: string;
  title: string;
  summary: string;
  satisfaction: number | null;
  duration: string | null;
  author?: string;
}

interface CaseCardsProps {
  cases?: CaseCardData[];
}

const CATEGORY_LABELS: Record<string, string> = {
  DELIVERY: '배달',
  SHOPPING: '구매대행',
  WAITING: '줄서기',
  VISIT: '방문대행',
  TRADE: '거래대행',
  OTHER: '기타',
};

const CATEGORY_COLORS: Record<string, string> = {
  DELIVERY: 'bg-blue-100 text-blue-700',
  SHOPPING: 'bg-coral-100 text-coral-700',
  WAITING: 'bg-purple-100 text-purple-700',
  VISIT: 'bg-teal-100 text-teal-700',
  TRADE: 'bg-amber-100 text-amber-700',
  OTHER: 'bg-warm-100 text-warm-700',
};

const FALLBACK_CASES: CaseCardData[] = [
  {
    id: '1',
    category: 'DELIVERY',
    title: '급한 서류 배달, 30분 만에 해결!',
    summary:
      '회사에 중요한 계약서를 두고 왔는데, AI 매칭으로 근처 헬퍼가 바로 배정되어 30분 만에 사무실까지 전달해 주셨어요. 정말 빠르고 정확했습니다.',
    satisfaction: 4.9,
    duration: '30분',
    author: '김지현',
  },
  {
    id: '2',
    category: 'SHOPPING',
    title: '한정판 운동화 구매대행 성공',
    summary:
      '오프라인 매장 한정 판매라 직접 갈 수 없었는데, 헬퍼분이 새벽부터 줄 서서 성공적으로 구매해 주셨어요. 감동이었습니다.',
    satisfaction: 5.0,
    duration: '3시간',
    author: '박준영',
  },
  {
    id: '3',
    category: 'WAITING',
    title: '인기 맛집 줄서기 대행, 2시간 절약',
    summary:
      '주말에 유명 맛집에 가고 싶었지만 대기가 2시간이라 망설였어요. 헬퍼분이 미리 줄 서 주셔서 도착하자마자 바로 입장할 수 있었습니다.',
    satisfaction: 4.8,
    duration: '2시간',
    author: '이수빈',
  },
  {
    id: '4',
    category: 'VISIT',
    title: '관공서 서류 발급 대행',
    summary:
      '평일에 시간을 낼 수가 없어서 주민센터 서류 발급을 맡겼는데, 헬퍼분이 꼼꼼하게 처리해 주시고 사진으로 확인까지 보내주셨어요.',
    satisfaction: 4.7,
    duration: '1시간',
    author: '최민서',
  },
  {
    id: '5',
    category: 'TRADE',
    title: '중고 노트북 직거래 안전 대행',
    summary:
      '중고 노트북을 사고 싶었지만 직거래가 불안했어요. 헬퍼분이 대신 만나서 상태 확인하고 영상통화로 보여주신 후 결제까지 안전하게 완료해 주셨습니다.',
    satisfaction: 4.9,
    duration: '1시간 30분',
    author: '정하윤',
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < Math.round(rating) ? 'text-amber-400' : 'text-warm-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm font-semibold text-warm-700 ml-1.5">{rating}</span>
    </div>
  );
}

export default function CaseCards({ cases }: CaseCardsProps) {
  const displayCases = cases && cases.length > 0 ? cases : FALLBACK_CASES;

  return (
    <section className="py-16 sm:py-24 bg-warm-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <h2 className="section-header">이미 많은 분들이 경험했습니다</h2>
          <p className="section-subtitle">
            실제 이용자들의 생생한 후기를 확인하세요
          </p>
        </div>

        {/* Case Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCases.map((caseItem, idx) => (
            <article
              key={caseItem.id}
              className={`bg-white rounded-2xl border border-warm-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                idx >= 3 ? 'hidden lg:block' : ''
              }`}
            >
              <div className="p-6">
                {/* Quote mark */}
                <span
                  className="block text-4xl font-serif text-indigo-200 leading-none mb-2 select-none"
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                {/* Summary in quotes */}
                <p className="text-sm text-warm-600 leading-relaxed line-clamp-3 mb-4">
                  &ldquo;{caseItem.summary}&rdquo;
                </p>

                {/* Title */}
                <h3 className="text-base font-bold text-warm-900 mb-4 line-clamp-1">
                  {caseItem.title}
                </h3>

                {/* Category badge + Duration */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      CATEGORY_COLORS[caseItem.category] || CATEGORY_COLORS.OTHER
                    }`}
                  >
                    {CATEGORY_LABELS[caseItem.category] || '기타'}
                  </span>
                  {caseItem.duration && (
                    <span className="flex items-center gap-1 text-xs text-warm-400 bg-warm-50 px-2.5 py-1 rounded-full">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {caseItem.duration}
                    </span>
                  )}
                </div>

                {/* Bottom: Rating + Avatar */}
                <div className="flex items-center justify-between pt-4 border-t border-warm-100">
                  {caseItem.satisfaction != null && (
                    <StarRating rating={caseItem.satisfaction} />
                  )}
                  {caseItem.author && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {caseItem.author.charAt(0)}
                      </div>
                      <span className="text-xs text-warm-500">{caseItem.author}</span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* More link */}
        <div className="mt-10 text-center">
          <Link
            href="/cases"
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            우수 사례 더 보기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
