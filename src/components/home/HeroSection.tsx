'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface StatItem {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  label: string;
  decimals?: number;
}

const STATS: StatItem[] = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    value: 100000,
    suffix: '+',
    label: '누적 완료',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    value: 5000,
    suffix: '+',
    label: '검증된 헬퍼',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    value: 4.9,
    suffix: '',
    label: '평균 평점',
    decimals: 1,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
        />
      </svg>
    ),
    value: 0,
    suffix: '원',
    label: '플랫폼 수수료',
  },
];

function formatNumber(n: number, decimals?: number): string {
  if (decimals !== undefined && decimals > 0) {
    return n.toFixed(decimals);
  }
  if (n >= 1000) {
    return n.toLocaleString('ko-KR');
  }
  return String(Math.round(n));
}

export default function HeroSection() {
  const [counts, setCounts] = useState<number[]>(STATS.map(() => 0));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCounts(
        STATS.map((stat) => {
          if (stat.decimals) {
            return parseFloat((stat.value * eased).toFixed(stat.decimals));
          }
          return Math.round(stat.value * eased);
        })
      );

      if (step >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 min-h-[600px]">
      {/* Decorative background shapes */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-teal-500/15 rounded-full blur-3xl animate-float delay-200" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-coral-500/10 rounded-full blur-3xl animate-float delay-400" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl" />
      </div>

      {/* Gradient mesh overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(at 20% 80%, rgba(99,102,241,0.3) 0%, transparent 50%), radial-gradient(at 80% 20%, rgba(20,184,166,0.2) 0%, transparent 50%), radial-gradient(at 50% 50%, rgba(249,115,22,0.1) 0%, transparent 50%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          {/* Zero Fee Badge */}
          <div
            className={`inline-flex items-center gap-2 px-5 py-2.5 mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-full transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-400" />
            </span>
            <span className="text-sm font-semibold text-white/90 tracking-wide">
              플랫폼 수수료 0원
            </span>
            <div className="absolute inset-0 rounded-full animate-shimmer" />
          </div>

          {/* Headline */}
          <h1
            className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight transition-all duration-700 delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            일상의 모든 심부름,
            <br />
            <span className="gradient-text">AI가 완벽하게 연결합니다</span>
          </h1>

          {/* Subtitle */}
          <p
            className={`mt-6 text-lg sm:text-xl text-indigo-200 max-w-xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            배달, 구매대행, 줄서기 등 모든 생활 심부름을
            <br className="hidden sm:block" />
            검증된 헬퍼가 안전하게 처리합니다.
          </p>

          {/* CTA Buttons */}
          <div
            className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <Link
              href="/dashboard/requests/new"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-indigo-700 bg-white hover:bg-indigo-50 rounded-xl shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-center"
            >
              지금 요청하기
            </Link>
            <Link
              href="/helper-apply"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 rounded-xl transition-all duration-300 hover:-translate-y-1 text-center"
            >
              헬퍼로 시작하기
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div
          className={`mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto transition-all duration-700 delay-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {STATS.map((stat, idx) => (
            <div
              key={stat.label}
              className="glass rounded-2xl px-5 py-4 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-teal-300">
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-white leading-none">
                  {formatNumber(counts[idx], stat.decimals)}
                  {stat.suffix}
                </p>
                <p className="text-xs text-indigo-300 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
