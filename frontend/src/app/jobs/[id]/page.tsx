'use client';

import Link from 'next/link';
import { ArrowLeft, Heart, Share2, Flag, MapPin, Clock, Banknote, Building2, Phone, CheckCircle } from 'lucide-react';

const JOB = {
  title: '강남 프리미엄 라운지 스탭', description: '강남 최고급 라운지에서 함께할 스탭을 모집합니다.\n\n친절하고 밝은 성격의 분을 찾고 있으며, 경력 무관으로 초보자도 환영합니다.\n\n편안한 근무 환경과 높은 수익을 보장합니다.',
  region: '서울 강남', jobType: '라운지', payAmount: 500000, workingHours: 'PM 8:00 ~ AM 3:00',
  benefits: ['교통비 지원', '식사 제공', '숙박 가능', '당일 지급'], requirements: '19세 이상 여성',
  isUrgent: true, viewCount: 1234,
  company: { name: '강남 프리미엄 라운지', address: '서울특별시 강남구 논현동 123-45', phone: '010-1234-5678', isVerified: true },
};

export default function JobDetailPage() {
  const pay = new Intl.NumberFormat('ko-KR').format(JOB.payAmount) + '원/일';
  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <Link href="/jobs/" className="mb-3 inline-flex items-center gap-1 text-sm text-[#9a8aa8] hover:text-white"><ArrowLeft className="h-4 w-4" /> 목록</Link>

      <div className="card mb-4 h-40 md:h-56"><div className="flex h-full items-center justify-center text-4xl opacity-30">🦊</div></div>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {JOB.isUrgent && <span className="tag bg-[#ff6b6b]/15 text-[#ff6b6b]">급구</span>}
        {JOB.company.isVerified && <span className="tag bg-[#4ade80]/15 text-[#4ade80]"><CheckCircle className="mr-0.5 h-3 w-3" />인증</span>}
        <span className="tag bg-[#1e142a] text-[#9a8aa8]">{JOB.jobType}</span>
      </div>
      <h1 className="text-xl font-bold">{JOB.title}</h1>
      <p className="mt-1 text-sm text-[#9a8aa8]">{JOB.company.name}</p>

      <div className="card mt-4 bg-gradient-to-r from-[#d4a76a]/5 to-[#e85d8a]/5 p-4">
        <p className="text-xs text-[#9a8aa8]">급여</p>
        <p className="text-2xl font-bold text-[#d4a76a]">{pay}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {[{ I: MapPin, l: '위치', v: JOB.region }, { I: Clock, l: '시간', v: JOB.workingHours }, { I: Banknote, l: '형태', v: '일급' }, { I: Building2, l: '업종', v: JOB.jobType }].map(({ I, l, v }) => (
          <div key={l} className="card-sm p-3">
            <div className="flex items-center gap-1 text-[#6a5a7a]"><I className="h-3.5 w-3.5" /><span className="text-[10px]">{l}</span></div>
            <p className="mt-1 text-sm font-medium">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">혜택</h2>
        <div className="flex flex-wrap gap-1.5">{JOB.benefits.map(b => <span key={b} className="rounded-lg border border-[#d4a76a]/20 bg-[#d4a76a]/5 px-3 py-1 text-xs text-[#d4a76a]">{b}</span>)}</div>
      </div>

      <div className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">상세 내용</h2>
        <div className="card-sm whitespace-pre-wrap p-4 text-sm leading-relaxed text-[#9a8aa8]">{JOB.description}</div>
      </div>

      <div className="card mt-4 p-4">
        <h2 className="mb-2 text-sm font-semibold">업소 정보</h2>
        <div className="space-y-1.5 text-sm text-[#9a8aa8]">
          <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[#6a5a7a]" />{JOB.company.name}</p>
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#6a5a7a]" />{JOB.company.address}</p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#6a5a7a]" />{JOB.company.phone}</p>
        </div>
      </div>

      <div className="sticky bottom-16 mt-4 flex gap-2 rounded-2xl border border-[#2a1e3a] bg-[#120b18]/90 p-3 backdrop-blur md:bottom-4">
        <button className="h-10 w-10 rounded-xl border border-[#2a1e3a] text-[#9a8aa8] hover:text-[#e85d8a] flex items-center justify-center"><Heart className="h-4 w-4" /></button>
        <button className="h-10 w-10 rounded-xl border border-[#2a1e3a] text-[#9a8aa8] hover:text-[#d4a76a] flex items-center justify-center"><Share2 className="h-4 w-4" /></button>
        <button className="btn-primary flex-1 py-2.5 text-sm text-center">지원하기</button>
        <button className="h-10 w-10 rounded-xl border border-[#2a1e3a] text-[#9a8aa8] hover:text-[#ff6b6b] flex items-center justify-center"><Flag className="h-4 w-4" /></button>
      </div>
      <p className="mt-2 text-center text-[10px] text-[#6a5a7a]">조회 {JOB.viewCount.toLocaleString()}</p>
    </div>
  );
}
