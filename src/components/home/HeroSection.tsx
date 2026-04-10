'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HeroSection() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/dashboard/requests/new?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const tags = ['배달대행', '구매대행', '줄서기', '방문대행', '거래대행'];

  return (
    <section className="bg-gradient-to-b from-teal-50 via-teal-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* LEFT - Main content */}
          <div className="flex-1 lg:max-w-[60%]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full mb-5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              AI 기반 생활대행 플랫폼
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-warm-900 leading-tight">
              심부름이 필요할 때,
              <br />
              <span className="text-teal-600">Simburum</span>에 맡기세요
            </h1>

            <p className="mt-4 text-base sm:text-lg text-warm-500 leading-relaxed max-w-lg">
              AI가 가장 적합한 헬퍼를 매칭해 드립니다.
              <span className="text-teal-600 font-semibold"> 플랫폼 이용료 무료.</span>
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="mt-7 flex items-stretch max-w-xl">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="어떤 심부름이 필요하세요?"
                  className="w-full pl-12 pr-4 py-4 text-base border-2 border-warm-200 border-r-0 rounded-l-2xl bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-6 sm:px-8 bg-teal-600 hover:bg-teal-700 text-white font-bold text-base rounded-r-2xl transition-colors whitespace-nowrap"
              >
                요청하기
              </button>
            </form>

            {/* Popular tags */}
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/services`}
                  className="text-sm text-warm-500 hover:text-teal-600 hover:bg-teal-50 px-3 py-1 rounded-full border border-warm-200 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          {/* RIGHT - Cards */}
          <div className="lg:w-[40%] flex flex-col gap-4">
            {/* Promotion card */}
            <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-6 text-white">
              <p className="text-sm opacity-90">지금 가입하면</p>
              <p className="text-xl font-bold mt-1">AI 프리미엄 매칭 무료</p>
              <p className="text-sm opacity-80 mt-2">플랫폼 이용료 무료 · 헬퍼 보수만 지불</p>
              <Link
                href="/register"
                className="inline-block mt-4 px-6 py-2.5 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-colors text-sm"
              >
                무료로 시작하기
              </Link>
            </div>

            {/* Fee clarification card */}
            <div className="bg-white rounded-2xl border border-warm-200 p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-warm-800">요금 안내</p>
                  <p className="text-xs text-warm-500 mt-0.5">플랫폼 수수료와 심부름 비용은 달라요</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-warm-100">
                  <span className="text-warm-600">플랫폼 이용료</span>
                  <span className="font-bold text-teal-600">무료</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-warm-100">
                  <span className="text-warm-600">AI 매칭 수수료</span>
                  <span className="font-bold text-teal-600">무료</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-warm-600">심부름 비용</span>
                  <span className="font-semibold text-warm-800">헬퍼와 협의</span>
                </div>
              </div>
              <Link href="/pricing" className="block mt-3 text-xs text-teal-600 hover:text-teal-700 font-medium text-center">
                자세한 요금 안내 &rarr;
              </Link>
            </div>

            {/* Login prompt */}
            <div className="bg-white rounded-2xl border border-warm-200 p-5">
              <p className="text-warm-700 font-semibold text-center text-sm">로그인하고 다양한 서비스를 이용해보세요</p>
              <Link
                href="/login"
                className="block mt-3 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-center transition-colors text-sm"
              >
                로그인
              </Link>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-warm-200 p-3 text-center">
                <p className="text-lg font-bold text-teal-600">0원</p>
                <p className="text-xs text-warm-500 mt-0.5">플랫폼 이용료</p>
              </div>
              <div className="bg-white rounded-xl border border-warm-200 p-3 text-center">
                <p className="text-lg font-bold text-indigo-600">5,000+</p>
                <p className="text-xs text-warm-500 mt-0.5">헬퍼</p>
              </div>
              <div className="bg-white rounded-xl border border-warm-200 p-3 text-center">
                <p className="text-lg font-bold text-coral-500">4.9</p>
                <p className="text-xs text-warm-500 mt-0.5">평점</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
