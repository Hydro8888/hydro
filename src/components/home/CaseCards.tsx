import React from 'react';
import Link from 'next/link';

interface CaseCardData {
  id: string;
  category: string;
  title: string;
  summary: string;
  satisfaction: number | null;
  duration: string | null;
}

interface CaseCardsProps {
  cases?: CaseCardData[];
}

const CATEGORY_LABELS: Record<string, string> = {
  CLEANING: '청소',
  DELIVERY: '배달',
  SHOPPING: '구매대행',
  MOVING: '이사',
  REPAIR: '수리',
  ERRAND: '심부름',
  PET: '반려동물',
  CARE: '돌봄',
  OTHER: '기타',
  WAITING: '줄서기',
  VISIT: '방문대행',
  TRADE: '거래대행',
};

const FALLBACK_CASES: CaseCardData[] = [
  {
    id: '1',
    category: 'DELIVERY',
    title: '급한 서류 배달, 30분 만에 완료',
    summary:
      '회사에 중요한 계약서를 깜빡하고 두고 온 의뢰자. AI 매칭으로 근처 헬퍼가 배정되어 30분 만에 사무실까지 서류를 전달했습니다.',
    satisfaction: 5.0,
    duration: '30분',
  },
  {
    id: '2',
    category: 'SHOPPING',
    title: '한정판 굿즈 구매대행 성공',
    summary:
      '오프라인 한정 판매 상품을 구매하고 싶었지만 직접 갈 수 없었던 의뢰자. 헬퍼가 오픈런부터 대신 줄 서서 성공적으로 구매했습니다.',
    satisfaction: 4.9,
    duration: '2시간',
  },
  {
    id: '3',
    category: 'ERRAND',
    title: '관공서 서류 발급 대행',
    summary:
      '평일 근무로 관공서 방문이 어려웠던 의뢰자를 위해 헬퍼가 주민센터에서 필요한 서류를 대신 발급받아 전달했습니다.',
    satisfaction: 4.8,
    duration: '1시간',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  DELIVERY: 'bg-blue-100 text-blue-700',
  SHOPPING: 'bg-purple-100 text-purple-700',
  WAITING: 'bg-amber-100 text-amber-700',
  VISIT: 'bg-teal-100 text-teal-700',
  TRADE: 'bg-pink-100 text-pink-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-sm font-medium text-gray-700 ml-1">{rating}</span>
    </div>
  );
}

export default function CaseCards({ cases }: CaseCardsProps) {
  const displayCases = cases && cases.length > 0 ? cases : FALLBACK_CASES;
  return (
    <section className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              우수 사례
            </h2>
            <p className="mt-3 text-lg text-gray-500">
              실제 이용자들의 성공적인 심부름 사례를 확인하세요
            </p>
          </div>
          <Link
            href="/simburum/cases"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            더 보기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Case Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayCases.map((caseItem) => (
            <article
              key={caseItem.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="p-6">
                {/* Category + Duration */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[caseItem.category] || CATEGORY_COLORS.OTHER}`}
                  >
                    {CATEGORY_LABELS[caseItem.category] || '기타'}
                  </span>
                  {caseItem.duration && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {caseItem.duration}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                  {caseItem.title}
                </h3>

                {/* Summary */}
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">
                  {caseItem.summary}
                </p>

                {/* Rating */}
                {caseItem.satisfaction != null && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <StarRating rating={caseItem.satisfaction} />
                    <span className="text-xs text-gray-400">만족도</span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Mobile "더 보기" Link */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/simburum/cases"
            className="inline-flex items-center gap-1 px-6 py-2.5 text-sm font-medium text-primary-600 border border-primary-200 hover:bg-primary-50 rounded-lg transition-colors"
          >
            더 보기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
