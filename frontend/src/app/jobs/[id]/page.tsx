'use client';

import Link from 'next/link';
import { ArrowLeft, Heart, Share2, Flag, MapPin, Clock, Banknote, Building2, Phone, CheckCircle } from 'lucide-react';

// Mock data for a single job detail
const MOCK_JOB = {
  id: '1',
  title: '강남 프리미엄 라운지 스탭',
  description: '강남 최고급 라운지에서 함께할 스탭을 모집합니다.\n\n친절하고 밝은 성격의 분을 찾고 있으며, 경력 무관으로 초보자도 환영합니다.\n\n편안한 근무 환경과 높은 수익을 보장합니다.',
  region: '서울 강남',
  address: '서울특별시 강남구 논현동 123-45',
  jobType: '라운지',
  payType: 'daily',
  payAmount: 500000,
  workingHours: 'PM 8:00 ~ AM 3:00',
  benefits: ['교통비 지원', '식사 제공', '숙박 가능', '당일 지급'],
  requirements: '19세 이상 여성, 단정한 외모',
  images: [],
  isUrgent: true,
  viewCount: 1234,
  company: {
    name: '강남 프리미엄 라운지',
    region: '서울 강남',
    address: '서울특별시 강남구 논현동 123-45',
    phone: '010-1234-5678',
    isVerified: true,
  },
};

function formatPay(amount: number, type: string) {
  const formatted = new Intl.NumberFormat('ko-KR').format(amount);
  const typeLabel = type === 'daily' ? '일' : type === 'hourly' ? '시' : '월';
  return `${formatted}원/${typeLabel}`;
}

export default function JobDetailPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Back button */}
      <Link href="/jobs" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> 목록으로
      </Link>

      {/* Image placeholder */}
      <div className="mb-6 h-48 overflow-hidden rounded-xl bg-gradient-to-br from-card to-muted md:h-64">
        <div className="flex h-full items-center justify-center text-muted-foreground">
          업소 이미지
        </div>
      </div>

      {/* Title & badges */}
      <div className="mb-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {MOCK_JOB.isUrgent && (
            <span className="rounded-full bg-destructive/20 px-2.5 py-0.5 text-xs font-medium text-destructive">급구</span>
          )}
          {MOCK_JOB.company.isVerified && (
            <span className="flex items-center gap-1 rounded-full bg-success/20 px-2.5 py-0.5 text-xs font-medium text-success">
              <CheckCircle className="h-3 w-3" /> 인증업소
            </span>
          )}
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{MOCK_JOB.jobType}</span>
        </div>
        <h1 className="text-2xl font-bold">{MOCK_JOB.title}</h1>
        <p className="mt-1 text-muted-foreground">{MOCK_JOB.company.name}</p>
      </div>

      {/* Pay highlight */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 p-5">
        <p className="text-sm text-muted-foreground">급여</p>
        <p className="text-3xl font-bold text-accent">{formatPay(MOCK_JOB.payAmount, MOCK_JOB.payType)}</p>
      </div>

      {/* Info grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-xs">위치</span>
          </div>
          <p className="mt-1 text-sm font-medium">{MOCK_JOB.region}</p>
        </div>
        <div className="rounded-lg bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs">근무시간</span>
          </div>
          <p className="mt-1 text-sm font-medium">{MOCK_JOB.workingHours}</p>
        </div>
        <div className="rounded-lg bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Banknote className="h-4 w-4" />
            <span className="text-xs">급여형태</span>
          </div>
          <p className="mt-1 text-sm font-medium">{MOCK_JOB.payType === 'daily' ? '일급' : MOCK_JOB.payType === 'hourly' ? '시급' : '월급'}</p>
        </div>
        <div className="rounded-lg bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="text-xs">업종</span>
          </div>
          <p className="mt-1 text-sm font-medium">{MOCK_JOB.jobType}</p>
        </div>
      </div>

      {/* Benefits */}
      {MOCK_JOB.benefits.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">혜택</h2>
          <div className="flex flex-wrap gap-2">
            {MOCK_JOB.benefits.map((b) => (
              <span key={b} className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm text-accent">
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">상세 내용</h2>
        <div className="whitespace-pre-wrap rounded-xl bg-card p-5 text-sm leading-relaxed text-muted-foreground">
          {MOCK_JOB.description}
        </div>
      </div>

      {/* Requirements */}
      {MOCK_JOB.requirements && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">자격 요건</h2>
          <p className="text-sm text-muted-foreground">{MOCK_JOB.requirements}</p>
        </div>
      )}

      {/* Company info */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-lg font-semibold">업소 정보</h2>
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {MOCK_JOB.company.name}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {MOCK_JOB.company.address}
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {MOCK_JOB.company.phone}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="sticky bottom-16 flex gap-3 rounded-xl border border-border bg-background/90 p-4 backdrop-blur-md md:bottom-4">
        <button className="rounded-full border border-border p-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          <Heart className="h-5 w-5" />
        </button>
        <button className="rounded-full border border-border p-3 text-muted-foreground transition-colors hover:border-accent hover:text-accent">
          <Share2 className="h-5 w-5" />
        </button>
        <button className="flex-1 rounded-full bg-primary py-3 text-center font-semibold text-white transition-all hover:bg-primary-light">
          지원하기
        </button>
        <button className="rounded-full border border-border p-3 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive">
          <Flag className="h-5 w-5" />
        </button>
      </div>

      {/* View count */}
      <p className="mt-4 text-center text-xs text-muted-foreground">조회수 {MOCK_JOB.viewCount.toLocaleString()}</p>
    </div>
  );
}
