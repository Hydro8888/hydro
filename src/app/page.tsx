import React from 'react';
import Link from 'next/link';
import { HeroSection, CategoryGrid, HowItWorks, TrustBadges } from '@/components/home';
import prisma from '@/lib/prisma';

export default async function HomePage() {
  const cases = await prisma.successCase.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const recentCases = cases.length > 0 ? cases : [
    { id: '1', category: '배달', title: '급한 서류 배달, 30분 만에 해결!', duration: '30분', satisfaction: 4.9 },
    { id: '2', category: '구매대행', title: '한정판 운동화 구매대행 성공', duration: '2시간', satisfaction: 5.0 },
    { id: '3', category: '줄서기', title: '인기 맛집 줄서기 대행, 2시간 절약', duration: '2시간', satisfaction: 4.8 },
    { id: '4', category: '방문대행', title: '관공서 서류 발급 대행', duration: '1시간', satisfaction: 4.7 },
    { id: '5', category: '거래대행', title: '중고 노트북 직거래 안전 대행', duration: '1시간 30분', satisfaction: 4.9 },
  ];

  const categoryColors: Record<string, string> = {
    '배달': 'bg-blue-100 text-blue-700',
    '구매대행': 'bg-coral-100 text-coral-700',
    '줄서기': 'bg-purple-100 text-purple-700',
    '방문대행': 'bg-teal-100 text-teal-700',
    '거래대행': 'bg-amber-100 text-amber-700',
  };

  const suggestions = [
    '편의점에서 도시락 사다 주세요',
    '관공서 서류 발급 대행해 주세요',
    '중고폰 직거래 같이 가주세요',
    '맛집 줄서기 대신 해주세요',
  ];

  return (
    <>
      <HeroSection />
      <CategoryGrid />

      {/* Two-column layout like Baemin */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT - Recent completed */}
          <div className="flex-1 bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h2 className="text-lg font-bold text-warm-900">최근 완료된 심부름</h2>
              <Link href="/cases" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                더보기 &rarr;
              </Link>
            </div>
            <div className="divide-y divide-warm-100">
              {recentCases.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-warm-50 transition-colors">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${categoryColors[c.category] || 'bg-warm-100 text-warm-600'}`}>
                    {c.category}
                  </span>
                  <span className="flex-1 text-sm text-warm-800 truncate">{c.title}</span>
                  <span className="text-xs text-warm-400 whitespace-nowrap">{c.duration}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT - Suggestions */}
          <div className="lg:w-80 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-warm-100 shadow-sm p-6">
              <h3 className="font-bold text-warm-900 mb-3">이런 심부름은 어때요?</h3>
              <div className="space-y-2.5">
                {suggestions.map((s, i) => (
                  <Link
                    key={i}
                    href={`/dashboard/requests/new?q=${encodeURIComponent(s)}`}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-warm-50 hover:bg-teal-50 border border-warm-100 hover:border-teal-200 transition-all group"
                  >
                    <span className="text-teal-500 group-hover:text-teal-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </span>
                    <span className="text-sm text-warm-700 group-hover:text-teal-700">{s}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Ad/promo space */}
            <div className="bg-gradient-to-br from-coral-400 to-coral-600 rounded-2xl p-6 text-white">
              <p className="text-sm opacity-90">잠깐 쉬는 시간!</p>
              <p className="text-lg font-bold mt-1">헬퍼로 부수입 올리기</p>
              <p className="text-sm opacity-80 mt-1">빈 시간에 심부름을 수행하고 수익을 올려보세요</p>
              <Link href="/helper-apply" className="inline-block mt-3 px-5 py-2 bg-white text-coral-600 font-bold rounded-xl text-sm hover:bg-coral-50 transition-colors">
                지원하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HowItWorks />
      <TrustBadges />

      {/* Helper recruitment section (like Baemin partner) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-warm-100">
            <h2 className="text-lg font-bold text-warm-900">헬퍼로 수익을 올려보세요</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x divide-warm-100">
            <div className="p-6">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="font-bold text-warm-900">자유로운 수익</h3>
              <p className="text-sm text-warm-500 mt-1">원하는 시간에 원하는 만큼 수행하세요. 플랫폼 수수료 0원.</p>
            </div>
            <div className="p-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="font-bold text-warm-900">안전한 환경</h3>
              <p className="text-sm text-warm-500 mt-1">실명 인증된 요청자, 에스크로 결제, 24시간 지원.</p>
            </div>
            <div className="p-6">
              <div className="w-10 h-10 rounded-xl bg-coral-100 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="font-bold text-warm-900">빠른 시작</h3>
              <p className="text-sm text-warm-500 mt-1">간단한 인증 후 바로 시작. AI가 적합한 요청을 추천.</p>
            </div>
          </div>
          <div className="px-6 py-4 bg-warm-50 border-t border-warm-100">
            <Link href="/helper-apply" className="text-sm font-semibold text-teal-600 hover:text-teal-700">
              헬퍼 지원하기 &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-teal-600 to-teal-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">지금 시작하세요</h2>
          <p className="text-lg text-teal-100 mb-2">플랫폼 이용료 무료 · AI 매칭 서비스를 경험하세요</p>
          <p className="text-sm text-teal-200 mb-8">심부름 비용은 헬퍼와 협의하여 결정합니다</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-colors text-center">
              무료로 시작하기
            </Link>
            <Link href="/services" className="w-full sm:w-auto px-8 py-4 text-white border-2 border-white/30 hover:border-white/60 font-bold rounded-xl transition-colors text-center">
              서비스 둘러보기
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
