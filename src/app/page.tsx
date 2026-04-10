import React from 'react';
import Link from 'next/link';
import { HeroSection, CategoryGrid, HowItWorks, TrustBadges, CaseCards } from '@/components/home';
import prisma from '@/lib/prisma';

export default async function HomePage() {
  const cases = await prisma.successCase.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  const serialized = cases.map((c) => ({
    id: c.id,
    category: c.category,
    title: c.title,
    summary: c.summary,
    duration: c.duration,
    satisfaction: c.satisfaction,
  }));

  return (
    <>
      <HeroSection />
      <CategoryGrid />
      <HowItWorks />
      <TrustBadges />
      <CaseCards cases={serialized} />

      {/* Final CTA Section */}
      <section className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 py-20 sm:py-28">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              지금 바로 시작하세요
            </h2>
            <p className="text-lg sm:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
              수수료 0원으로 AI 매칭 서비스를 경험하세요
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/simburum/register"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-indigo-700 bg-white hover:bg-indigo-50 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
              >
                무료로 시작하기
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/simburum/services"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                서비스 둘러보기
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
