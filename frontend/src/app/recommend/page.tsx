import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function RecommendPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">맞춤알바</h1>

      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-2 text-lg font-semibold">AI 맞춤 추천</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          프로필을 80% 이상 완성하면<br />
          AI가 딱 맞는 알바를 추천해드려요
        </p>

        <div className="mb-6">
          <div className="mx-auto h-3 w-64 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[30%] rounded-full bg-gradient-to-r from-primary to-accent transition-all" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">프로필 완성도 <span className="font-semibold text-primary">30%</span></p>
        </div>

        <div className="space-y-3">
          <Link
            href="/my"
            className="block rounded-xl border border-border bg-muted/50 p-4 text-left transition-all hover:border-primary/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">희망 지역 설정</p>
                <p className="text-xs text-muted-foreground">어디에서 일하고 싶으세요?</p>
              </div>
              <span className="text-xs text-destructive">미완료</span>
            </div>
          </Link>
          <Link
            href="/my"
            className="block rounded-xl border border-border bg-muted/50 p-4 text-left transition-all hover:border-primary/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">희망 업종 설정</p>
                <p className="text-xs text-muted-foreground">어떤 업종을 선호하세요?</p>
              </div>
              <span className="text-xs text-destructive">미완료</span>
            </div>
          </Link>
          <Link
            href="/my"
            className="block rounded-xl border border-border bg-muted/50 p-4 text-left transition-all hover:border-primary/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">희망 급여 설정</p>
                <p className="text-xs text-muted-foreground">최소 희망 급여를 알려주세요</p>
              </div>
              <span className="text-xs text-destructive">미완료</span>
            </div>
          </Link>
        </div>

        <Link
          href="/my"
          className="mt-6 inline-block rounded-full bg-primary px-8 py-3 font-semibold text-white transition-all hover:bg-primary-light"
        >
          프로필 완성하기
        </Link>
      </div>
    </div>
  );
}
