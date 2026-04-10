import React from 'react';

interface Step {
  number: number;
  numberLabel: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    number: 1,
    numberLabel: '01',
    title: '요청 등록',
    description:
      '필요한 심부름을 자연어로 입력하세요. AI가 자동으로 분류하고 예산을 추천합니다.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    numberLabel: '02',
    title: 'AI 매칭',
    description:
      '거리, 평판, 전문성을 종합 분석하여 가장 적합한 헬퍼를 추천합니다.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
  },
  {
    number: 3,
    numberLabel: '03',
    title: '안전하게 완료',
    description:
      '플랫폼 내 소통, 안전 결제, 양방향 리뷰로 안심하고 이용하세요.',
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
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-warm-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="section-header">이렇게 간단해요</h2>
          <p className="section-subtitle">
            3단계로 심부름을 맡기고 안전하게 완료하세요
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting dashed line - Desktop */}
          <div
            className="hidden lg:block absolute top-1/2 left-[20%] right-[20%] border-t-2 border-dashed border-indigo-200 -translate-y-1/2"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            {STEPS.map((step) => (
              <div key={step.number} className="relative">
                {/* Card with top gradient border */}
                <div className="relative bg-white rounded-2xl p-8 shadow-sm border border-warm-100 overflow-hidden">
                  {/* Top gradient accent */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-teal-500"
                    aria-hidden="true"
                  />

                  {/* Large background number */}
                  <span
                    className="absolute top-4 right-6 text-6xl font-black text-indigo-100 select-none leading-none"
                    aria-hidden="true"
                  >
                    {step.numberLabel}
                  </span>

                  {/* Icon circle */}
                  <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 mb-6">
                    {step.icon}
                  </div>

                  {/* Content */}
                  <h3 className="relative text-xl font-bold text-warm-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="relative text-sm text-warm-500 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
