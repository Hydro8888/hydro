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
  const pay = JOB.payAmount.toLocaleString() + '원/일';
  return (
    <div className="mx-auto max-w-[700px] px-3 py-4">
      <Link href="/jobs/" className="inline-flex items-center gap-1 text-[12px] text-[#888] hover:text-[#333] mb-3"><ArrowLeft className="h-3.5 w-3.5" /> 목록으로</Link>

      <div className="card mb-3 h-[160px] md:h-[220px] bg-[#1E3A5F] rounded flex items-center justify-center"><span className="text-4xl">🦊</span></div>

      <div className="flex flex-wrap items-center gap-1 mb-1">
        {JOB.isUrgent && <span className="tag bg-[#FFF3CD] text-[#856404] border border-[#FFEEBA]">급구</span>}
        {JOB.company.isVerified && <span className="tag bg-[#D4EDDA] text-[#155724] border border-[#C3E6CB]"><CheckCircle className="inline h-3 w-3 mr-0.5" />인증</span>}
        <span className="tag bg-[#f0f0f0] text-[#666] border border-[#e0e0e0]">{JOB.jobType}</span>
      </div>
      <h1 className="text-[20px] font-bold">{JOB.title}</h1>
      <p className="text-[13px] text-[#888] mt-0.5">{JOB.company.name}</p>

      <div className="card mt-3 p-4 bg-[#FFFDE7] border-[#C9A961]">
        <p className="text-[11px] text-[#888]">급여</p>
        <p className="text-[24px] font-bold text-[#C9A961]">{pay}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {[{ I: MapPin, l: '위치', v: JOB.region }, { I: Clock, l: '시간', v: JOB.workingHours }, { I: Banknote, l: '형태', v: '일급' }, { I: Building2, l: '업종', v: JOB.jobType }].map(({ I, l, v }) => (
          <div key={l} className="card p-3"><div className="flex items-center gap-1 text-[#999] text-[10px]"><I className="h-3 w-3" />{l}</div><p className="mt-0.5 text-[13px] font-medium">{v}</p></div>
        ))}
      </div>

      <div className="mt-3"><h2 className="text-[14px] font-bold mb-1.5">혜택</h2>
        <div className="flex flex-wrap gap-1">{JOB.benefits.map(b => <span key={b} className="border border-[#C9A961] bg-[#FFFDE7] rounded px-2.5 py-1 text-[11px] text-[#856404]">{b}</span>)}</div>
      </div>

      <div className="mt-3"><h2 className="text-[14px] font-bold mb-1.5">상세 내용</h2>
        <div className="card p-3 whitespace-pre-wrap text-[13px] text-[#555] leading-relaxed">{JOB.description}</div>
      </div>

      <div className="card mt-3 p-3">
        <h2 className="text-[14px] font-bold mb-1.5">업소 정보</h2>
        <div className="space-y-1 text-[13px] text-[#555]">
          <p className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-[#999]" />{JOB.company.name}</p>
          <p className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#999]" />{JOB.company.address}</p>
          <p className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-[#999]" />{JOB.company.phone}</p>
        </div>
      </div>

      <div className="sticky bottom-14 md:bottom-2 mt-3 flex gap-1.5 bg-white border border-[#ddd] rounded p-2">
        <button className="h-9 w-9 rounded border border-[#ddd] flex items-center justify-center text-[#999] hover:text-[#E91E63]"><Heart className="h-4 w-4" /></button>
        <button className="h-9 w-9 rounded border border-[#ddd] flex items-center justify-center text-[#999] hover:text-[#1E3A5F]"><Share2 className="h-4 w-4" /></button>
        <button className="btn btn-gold flex-1 py-2 text-[13px]">지원하기</button>
        <button className="h-9 w-9 rounded border border-[#ddd] flex items-center justify-center text-[#999] hover:text-[#E91E63]"><Flag className="h-4 w-4" /></button>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-[#ccc]">조회 {JOB.viewCount.toLocaleString()}</p>
    </div>
  );
}
