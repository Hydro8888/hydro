import React from 'react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-3xl mx-auto text-center">
          {/* Zero Fee Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-white">
              플랫폼 수수료 0원
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
            귀찮은 일은
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-accent-300">
              맡기세요
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-primary-100 max-w-xl mx-auto leading-relaxed">
            AI가 가장 적합한 헬퍼를 연결합니다.
            <br className="hidden sm:block" />
            배달, 구매대행, 줄서기 등 모든 생활 심부름을 안전하게.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/simburum/dashboard/requests/new"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-primary-700 bg-white hover:bg-gray-50 rounded-xl shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 text-center"
            >
              요청하기
            </Link>
            <Link
              href="/simburum/helper-apply"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 rounded-xl transition-all duration-200 hover:-translate-y-0.5 text-center"
            >
              헬퍼 지원하기
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">10만+</p>
              <p className="mt-1 text-sm text-primary-200">완료된 요청</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">5,000+</p>
              <p className="mt-1 text-sm text-primary-200">인증 헬퍼</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">4.9</p>
              <p className="mt-1 text-sm text-primary-200">평균 평점</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
