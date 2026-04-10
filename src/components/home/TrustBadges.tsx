import React from 'react';

interface TrustItem {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const TRUST_ITEMS: TrustItem[] = [
  {
    title: '실명 인증',
    description:
      '모든 사용자와 헬퍼는 실명 인증을 완료해야 서비스를 이용할 수 있습니다. 신뢰할 수 있는 거래 환경을 보장합니다.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
        />
      </svg>
    ),
  },
  {
    title: '양방향 리뷰',
    description:
      '요청자와 헬퍼 모두 리뷰를 남길 수 있습니다. 정확도, 친절도, 시간 준수 등 세부 항목별 평가로 투명한 피드백을 제공합니다.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    ),
  },
  {
    title: '안전 결제',
    description:
      '결제 금액은 플랫폼이 안전하게 보관하고, 서비스 완료 확인 후 헬퍼에게 정산됩니다. 문제 발생 시 환불 보장.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    title: '기록 보관',
    description:
      '모든 요청, 채팅, 결제 내역이 안전하게 보관됩니다. 분쟁 발생 시 투명한 증거자료로 활용되어 공정한 해결을 지원합니다.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
        />
      </svg>
    ),
  },
];

export default function TrustBadges() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            안전·신뢰
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            안심하고 이용하세요
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            4가지 안전 장치로 여러분의 거래를 보호합니다
          </p>
        </div>

        {/* Trust Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.title}
              className="text-center p-6 rounded-2xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50/30 transition-colors"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 text-primary-600 rounded-xl mb-5">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
