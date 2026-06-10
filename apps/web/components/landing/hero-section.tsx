import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeroChatDemo } from './hero-chat-demo';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-white dark:bg-gray-950">
      {/* Subtle decorative grid */}
      <div className="absolute inset-0 hero-grid opacity-40" />
      <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-radial from-primary-100/40 via-transparent to-transparent dark:from-primary-950/30 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        {/* Eyebrow badge */}
        <div className="flex justify-center mb-6">
          <Badge variant="primary" size="lg" className="gap-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            All-in-One AI Platform
          </Badge>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-gray-900 dark:text-white leading-[1.1] md:leading-[1.05] mb-6">
          하나의 대시보드로
          <br />
          <span className="text-primary-600 dark:text-primary-400">세계 최고 AI</span>를 만나세요
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          GPT-5.5, Claude Opus 4.8, Gemini 3.5 Flash, Grok 4.3 등 전세계 TOP 10 프리미엄 AI를
          하나의 인터페이스에서 자유롭게 비교하고 사용하세요.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <Button href="/chat" variant="primary" size="xl" rightIcon={<ArrowRight className="w-4 h-4" />}>
            무료로 시작하기
          </Button>
          <Button href="#features" variant="secondary" size="xl">
            기능 둘러보기
          </Button>
        </div>

        {/* Trust micro-copy */}
        <div className="flex items-center justify-center gap-5 text-sm text-gray-500 dark:text-gray-400 mb-16">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-success-500" />
            카드 정보 불필요
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-success-500" />
            50,000 토큰 무료
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <Check className="w-4 h-4 text-success-500" />
            30초 가입
          </span>
        </div>

        {/* Animated AI chat demo */}
        <HeroChatDemo />
      </div>
    </section>
  );
}
