import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FinalCta() {
  return (
    <section className="py-20 md:py-24 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs p-12 md:p-16 text-center">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 hero-grid opacity-40 pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950 border border-primary-100 dark:border-primary-900 text-primary-600 dark:text-primary-400 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              지금 시작하세요
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 dark:text-white tracking-tight mb-4">
              오늘부터 AI로
              <br />
              일하는 방식을 바꾸세요
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
              50,000 토큰을 무료로 받고, 세계 최고의 AI를 지금 바로 경험하세요
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Button href="/chat" variant="primary" size="xl" rightIcon={<ArrowRight className="w-4 h-4" />}>
                무료로 시작하기
              </Button>
              <Button href="mailto:contact@free.ai.kr" variant="secondary" size="xl">
                영업팀 문의
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span>✓ 카드 정보 불필요</span>
              <span>✓ 즉시 시작</span>
              <span>✓ 언제든 취소</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
