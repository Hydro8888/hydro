import React from 'react';
import Link from 'next/link';

const COMPARISON = [
  { feature: '수수료', simburum: '0원', competitor: '10~20%', good: true },
  { feature: 'AI 매칭', simburum: true, competitor: false, good: true },
  { feature: '실명 인증', simburum: true, competitor: 'partial', good: true },
  { feature: '에스크로 결제', simburum: true, competitor: 'partial', good: true },
  { feature: '양방향 리뷰', simburum: true, competitor: false, good: true },
];

function renderValue(val: string | boolean) {
  if (val === true) {
    return (
      <svg className="w-6 h-6 text-teal-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    );
  }
  if (val === false) {
    return (
      <svg className="w-6 h-6 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  if (val === 'partial') {
    return <span className="text-warm-400 text-lg font-medium">{'\u25B3'}</span>;
  }
  return <span>{val}</span>;
}

export default function PricingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-600 to-indigo-800 py-20 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            투명한 요금 안내
          </h1>
          <p className="text-lg text-indigo-200 max-w-2xl mx-auto">
            Simburum은 숨겨진 비용 없이 투명한 요금 정책을 운영합니다
          </p>
        </div>
      </section>

      {/* Big Zero Fee */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 border border-teal-200 rounded-full mb-8">
            <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-teal-700">현재 프로모션 진행 중</span>
          </div>
          <div className="flex items-end justify-center gap-2 mb-4">
            <span className="text-9xl font-black text-teal-400 leading-none">0</span>
            <span className="text-4xl font-bold text-warm-800 mb-4">원</span>
          </div>
          <p className="text-xl text-warm-500 font-medium">
            플랫폼 이용 수수료
          </p>
          <p className="text-warm-400 mt-3 max-w-lg mx-auto">
            요청 등록, AI 분석, 매칭 서비스 모두 무료로 제공됩니다.
            <br />
            헬퍼에게 지급하는 서비스 비용만 부담하세요.
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-warm-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-header mb-4">한눈에 비교하기</h2>
          <p className="section-subtitle mb-12">Simburum vs 일반 대행 서비스</p>

          <div className="bg-white rounded-2xl shadow-warm-lg border border-warm-100 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-3 bg-warm-50 border-b border-warm-100">
              <div className="p-5 text-sm font-semibold text-warm-600">비교 항목</div>
              <div className="p-5 text-center">
                <span className="text-sm font-bold text-indigo-600">Simburum</span>
              </div>
              <div className="p-5 text-center">
                <span className="text-sm font-medium text-warm-500">일반 대행 서비스</span>
              </div>
            </div>

            {/* Table Body */}
            {COMPARISON.map((row, idx) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 items-center ${
                  idx < COMPARISON.length - 1 ? 'border-b border-warm-100' : ''
                }`}
              >
                <div className="p-5 text-sm font-medium text-warm-800">{row.feature}</div>
                <div className="p-5 text-center text-sm font-semibold">
                  {typeof row.simburum === 'string' ? (
                    <span className="text-teal-600 font-bold">{row.simburum}</span>
                  ) : (
                    renderValue(row.simburum)
                  )}
                </div>
                <div className="p-5 text-center text-sm text-warm-500">
                  {renderValue(row.competitor)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fee Explanation Cards */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-header mb-4">요금 구조 안내</h2>
          <p className="section-subtitle mb-12">투명하고 합리적인 요금 구조를 확인하세요</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Helper Fee */}
            <div className="card-static text-center">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-warm-900 mb-2">헬퍼 보수</h3>
              <p className="text-sm text-warm-500 leading-relaxed">
                헬퍼에게 지급하는 서비스 비용은 요청 내용에 따라 다릅니다.
                AI가 적정 비용 범위를 제안하며, 최종 금액은 합의로 결정됩니다.
              </p>
            </div>

            {/* Platform Fee */}
            <div className="card-static text-center border-2 border-teal-200 bg-teal-50/30">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-teal-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-warm-900 mb-2">플랫폼 수수료</h3>
              <div className="text-3xl font-black text-teal-500 mb-2">0원</div>
              <p className="text-sm text-warm-500 leading-relaxed">
                Simburum 플랫폼 자체 이용 수수료는 0원입니다.
                요청 등록, AI 분석, 매칭 서비스 모두 무료입니다.
              </p>
            </div>

            {/* Payment Fee */}
            <div className="card-static text-center">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-warm-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-warm-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-warm-900 mb-2">결제 수수료</h3>
              <p className="text-sm text-warm-500 leading-relaxed">
                결제 금액은 에스크로 계정에 안전하게 보관됩니다.
                작업 완료 후 확인 시 헬퍼에게 지급됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            수수료 0원으로 시작하기
          </h2>
          <p className="text-lg text-indigo-200 mb-8 max-w-xl mx-auto">
            숨겨진 비용 없이 투명하게. 지금 바로 경험해보세요.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-indigo-700 bg-white hover:bg-indigo-50 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
          >
            무료로 시작하기
            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
