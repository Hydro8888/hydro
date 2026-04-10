import React from 'react';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: '요청 등록',
    description:
      '필요한 심부름을 자연어로 작성하세요. AI가 자동으로 카테고리를 분류하고 적정 예산을 제안합니다.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  },
  {
    number: 2,
    title: 'AI 매칭',
    description:
      'AI가 위치, 전문성, 평점, 가용 시간 등을 종합 분석하여 가장 적합한 헬퍼를 추천합니다.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    number: 3,
    title: '안전하게 완료',
    description:
      '실시간 채팅으로 소통하고, 안전 결제로 거래를 보호합니다. 완료 후 양방향 리뷰를 남기세요.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            이렇게 간단해요
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            3단계로 심부름을 맡기고 안전하게 완료하세요
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector Line - Desktop */}
          <div className="hidden lg:block absolute top-24 left-[16.7%] right-[16.7%] h-0.5 bg-gray-200" aria-hidden="true">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {STEPS.map((step) => (
              <div key={step.number} className="relative text-center">
                {/* Step Number Circle */}
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-primary-600 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
