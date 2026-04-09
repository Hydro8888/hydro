'use client';

import Link from 'next/link';
import { EmailCaptureForm } from './email-capture-form';
import { Sparkles } from 'lucide-react';

const providerBadges = [
  { name: 'GPT-5', color: '#10A37F', x: '-left-4 top-8', delay: '0s' },
  { name: 'Claude', color: '#CC785C', x: '-right-2 top-16', delay: '0.5s' },
  { name: 'Gemini', color: '#4285F4', x: '-left-6 bottom-24', delay: '1s' },
  { name: 'Grok', color: '#1DA1F2', x: '-right-4 bottom-12', delay: '1.5s' },
];

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 hero-grid opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        {/* Left: Text content */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950 border border-primary-100 dark:border-primary-900 text-primary-600 dark:text-primary-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            All-in-One AI Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            하나의 대시보드로
            <br />
            <span className="text-primary-500">세계 최고 AI</span>를
            <br className="hidden sm:block" />
            만나세요
          </h1>

          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
            GPT-5, Claude, Gemini, Grok 등 전세계 TOP 10 프리미엄 AI를
            하나의 인터페이스에서 자유롭게 비교하고 사용하세요.
          </p>

          <EmailCaptureForm />

          <p className="text-xs text-gray-400 flex items-center gap-4 flex-wrap">
            <span>✓ 카드 정보 불필요</span>
            <span>✓ 30초 가입</span>
            <span>✓ 50,000 토큰 무료</span>
          </p>

          <p className="text-xs text-gray-400">
            이미 계정이 있으신가요?{' '}
            <Link href="/sign-in" className="text-primary-500 hover:underline">로그인</Link>
          </p>
        </div>

        {/* Right: Dashboard mockup */}
        <div className="relative hidden md:block">
          {/* Floating provider badges */}
          {providerBadges.map((badge) => (
            <div
              key={badge.name}
              className={`absolute ${badge.x} z-10 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 text-xs font-medium animate-float`}
              style={{ animationDelay: badge.delay }}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: badge.color }} />
              {badge.name}
            </div>
          ))}

          {/* Dashboard illustration */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl shadow-primary-500/10 bg-white dark:bg-gray-900 overflow-hidden">
            {/* Mini top bar */}
            <div className="h-8 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-3 gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <div className="ml-3 h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            {/* Mini layout */}
            <div className="flex h-64">
              {/* Mini sidebar */}
              <div className="w-14 border-r border-gray-100 dark:border-gray-800 p-2 space-y-2">
                {['#10A37F', '#CC785C', '#4285F4', '#1DA1F2', '#FD6E00'].map((c, i) => (
                  <div key={i} className={`w-full h-6 rounded-lg ${i === 0 ? 'ring-2 ring-primary-400' : ''}`} style={{ backgroundColor: `${c}20` }}>
                    <div className="w-2.5 h-2.5 rounded-full mx-auto mt-[5px]" style={{ backgroundColor: c }} />
                  </div>
                ))}
              </div>
              {/* Mini chat area */}
              <div className="flex-1 p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded bg-primary-400" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <div className="space-y-1 text-right">
                    <div className="h-3 bg-primary-100 dark:bg-primary-900 rounded w-48" />
                    <div className="h-3 bg-primary-100 dark:bg-primary-900 rounded w-32 ml-auto" />
                  </div>
                  <div className="w-6 h-6 rounded bg-gray-300 dark:bg-gray-600" />
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded bg-primary-400" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                  </div>
                </div>
                {/* Typing indicator */}
                <div className="flex gap-1 ml-8">
                  <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
              {/* Mini context panel */}
              <div className="w-20 border-l border-gray-100 dark:border-gray-800 p-2 space-y-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-8 bg-primary-50 dark:bg-primary-950 rounded">
                  <div className="h-full bg-primary-400 rounded" style={{ width: '60%' }} />
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
