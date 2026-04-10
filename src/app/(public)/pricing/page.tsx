import React from 'react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">요금 안내</h1>
          <p className="mt-4 text-lg text-gray-600">심부름의 투명한 요금 정책을 안내합니다</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 rounded-full mb-4">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold text-green-700">현재 프로모션</span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-extrabold text-green-700 mb-2">
              플랫폼 수수료 0원
            </h2>
            <p className="text-lg text-green-600 font-medium">
              심부름은 현재 플랫폼 이용 수수료를 받지 않습니다
            </p>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">요금 구조 안내</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">플랫폼 수수료</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      심부름 플랫폼 자체 이용 수수료는 <strong className="text-green-600">0원</strong>입니다.
                      요청 등록, AI 분석, 매칭 서비스 모두 무료로 제공됩니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-accent-100 text-accent-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">헬퍼 서비스 비용</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      헬퍼에게 지급하는 서비스 비용은 요청 내용에 따라 다릅니다.
                      AI가 카테고리와 작업량을 분석하여 적정 비용 범위를 제안하며,
                      최종 금액은 요청자와 헬퍼 간 합의로 결정됩니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">에스크로 결제</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      결제 금액은 에스크로 계정에 안전하게 보관됩니다.
                      헬퍼가 작업을 완료하고 요청자가 확인한 후에만 헬퍼에게 금액이 지급됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-primary-50 border-primary-200">
              <h3 className="text-lg font-bold text-primary-900 mb-3">프리미엄 서비스 (준비 중)</h3>
              <p className="text-sm text-primary-700 mb-4">
                향후 다음과 같은 프리미엄 옵션이 추가될 예정입니다.
              </p>
              <ul className="space-y-2">
                {[
                  '우선 매칭 - 요청 등록 시 헬퍼 우선 배정',
                  '프리미엄 헬퍼 - 고평점·고경력 헬퍼 전용 매칭',
                  '정기 구독 - 월간 정기 요청 할인 패키지',
                  '기업 전용 플랜 - B2B 맞춤형 요금제',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-primary-700">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link href="/register" className="btn-primary text-lg py-3 px-8">
              무료로 시작하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
