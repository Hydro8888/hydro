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
  return (
    <div className="mx-auto max-w-[640px] px-4 py-5">
      <Link href="/jobs/" className="inline-flex items-center gap-1 text-sm text-[#999] hover:text-[#222] mb-4"><ArrowLeft className="h-4 w-4" /> 목록으로</Link>

      <div className="card mb-4 h-44 md:h-56 bg-[#1E3A5F] rounded-lg flex items-center justify-center"><span className="text-5xl">🦊</span></div>

      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {JOB.isUrgent && <span className="tag tag-urgent">급구</span>}
        {JOB.company.isVerified && <span className="tag tag-verified"><CheckCircle className="h-3 w-3" />인증</span>}
        <span className="tag tag-type">{JOB.jobType}</span>
      </div>
      <h1 className="text-xl font-bold">{JOB.title}</h1>
      <p className="text-sm text-[#999] mt-1">{JOB.company.name}</p>

      <div className="card mt-4 p-4 bg-[#FFFDE7] border-[#C9A961]">
        <p className="text-xs text-[#999]">급여</p>
        <p className="text-2xl font-bold text-[#C9A961]">{JOB.payAmount.toLocaleString()}원/일</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {[{ I: MapPin, l: '위치', v: JOB.region }, { I: Clock, l: '시간', v: JOB.workingHours }, { I: Banknote, l: '형태', v: '일급' }, { I: Building2, l: '업종', v: JOB.jobType }].map(({ I, l, v }) => (
          <div key={l} className="card p-3"><div className="flex items-center gap-1 text-[#999] text-xs"><I className="h-3.5 w-3.5" />{l}</div><p className="mt-1 text-sm font-medium">{v}</p></div>
        ))}
      </div>

      <div className="mt-4"><h2 className="text-base font-bold mb-2">혜택</h2>
        <div className="flex flex-wrap gap-2">{JOB.benefits.map(b => <span key={b} className="border border-[#C9A961] bg-[#FFFDE7] rounded-md px-3 py-1.5 text-xs text-[#666] font-medium">{b}</span>)}</div>
      </div>

      <div className="mt-4"><h2 className="text-base font-bold mb-2">상세 내용</h2>
        <div className="card p-4 whitespace-pre-wrap text-sm text-[#666] leading-relaxed">{JOB.description}</div>
      </div>

      <div className="card mt-4 p-4">
        <h2 className="text-base font-bold mb-2">업소 정보</h2>
        <div className="space-y-2 text-sm text-[#666]">
          <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[#999]" />{JOB.company.name}</p>
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#999]" />{JOB.company.address}</p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#999]" />{JOB.company.phone}</p>
        </div>
      </div>

      <div className="sticky bottom-14 md:bottom-2 mt-4 flex gap-2 bg-white border border-[#e0e0e0] rounded-lg p-3">
        <button className="btn btn-outline h-10 w-10"><Heart className="h-4 w-4" /></button>
        <button className="btn btn-outline h-10 w-10"><Share2 className="h-4 w-4" /></button>
        <button className="btn btn-gold flex-1 py-2.5 text-sm">지원하기</button>
        <button className="btn btn-outline h-10 w-10"><Flag className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
