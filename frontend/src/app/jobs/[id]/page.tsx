'use client';

import Link from 'next/link';
import { ArrowLeft, Heart, Share2, Flag, MapPin, Clock, Banknote, Building2, Phone, CheckCircle } from 'lucide-react';

const JOB = {
  title: '강남 프리미엄 라운지 스탭',
  description: '강남 최고급 라운지에서 함께할 스탭을 모집합니다.\n\n친절하고 밝은 성격의 분을 찾고 있으며, 경력 무관으로 초보자도 환영합니다.\n\n편안한 근무 환경과 높은 수익을 보장합니다.',
  region: '서울 강남', address: '서울특별시 강남구 논현동', jobType: '라운지',
  payType: 'daily', payAmount: 500000, workingHours: 'PM 8:00 ~ AM 3:00',
  benefits: ['교통비 지원', '식사 제공', '숙박 가능', '당일 지급'],
  requirements: '19세 이상 여성, 단정한 외모', isUrgent: true, viewCount: 1234,
  company: { name: '강남 프리미엄 라운지', address: '서울특별시 강남구 논현동 123-45', phone: '010-1234-5678', isVerified: true },
};

export default function JobDetailPage() {
  const pay = new Intl.NumberFormat('ko-KR').format(JOB.payAmount) + '원/일';

  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <Link href="/jobs/" className="mb-4 inline-flex items-center gap-1 text-sm text-[#7a8ba8] hover:text-white">
        <ArrowLeft className="h-4 w-4" /> 목록
      </Link>

      <div className="glass mb-4 h-40 overflow-hidden md:h-56">
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#111d35] to-[#0e1a30] text-[#4a5d7a]">업소 이미지</div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {JOB.isUrgent && <span className="rounded-lg bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">급구</span>}
        {JOB.company.isVerified && <span className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400"><CheckCircle className="h-3 w-3" />인증</span>}
        <span className="rounded-lg bg-[#111d35] px-2 py-0.5 text-xs text-[#7a8ba8]">{JOB.jobType}</span>
      </div>
      <h1 className="text-xl font-bold">{JOB.title}</h1>
      <p className="mt-1 text-sm text-[#7a8ba8]">{JOB.company.name}</p>

      <div className="glass mt-4 bg-gradient-to-r from-[#f0c040]/5 to-[#4a7dff]/5 p-4">
        <p className="text-xs text-[#7a8ba8]">급여</p>
        <p className="text-2xl font-bold text-[#f0c040]">{pay}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { icon: MapPin, label: '위치', value: JOB.region },
          { icon: Clock, label: '근무시간', value: JOB.workingHours },
          { icon: Banknote, label: '급여형태', value: '일급' },
          { icon: Building2, label: '업종', value: JOB.jobType },
        ].map((item) => (
          <div key={item.label} className="glass-sm p-3">
            <div className="flex items-center gap-1.5 text-[#4a5d7a]"><item.icon className="h-3.5 w-3.5" /><span className="text-[10px]">{item.label}</span></div>
            <p className="mt-1 text-sm font-medium">{item.value}</p>
          </div>
        ))}
      </div>

      {JOB.benefits.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-semibold">혜택</h2>
          <div className="flex flex-wrap gap-1.5">
            {JOB.benefits.map((b) => <span key={b} className="rounded-lg border border-[#f0c040]/20 bg-[#f0c040]/5 px-3 py-1 text-xs text-[#f0c040]">{b}</span>)}
          </div>
        </div>
      )}

      <div className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">상세 내용</h2>
        <div className="glass-sm whitespace-pre-wrap p-4 text-sm leading-relaxed text-[#7a8ba8]">{JOB.description}</div>
      </div>

      <div className="glass mt-4 p-4">
        <h2 className="mb-2 text-sm font-semibold">업소 정보</h2>
        <div className="space-y-1.5 text-sm text-[#7a8ba8]">
          <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[#4a5d7a]" />{JOB.company.name}</p>
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#4a5d7a]" />{JOB.company.address}</p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#4a5d7a]" />{JOB.company.phone}</p>
        </div>
      </div>

      <div className="sticky bottom-20 mt-4 flex gap-2 rounded-2xl border border-[#1e3050] bg-[#070d1a]/90 p-3 backdrop-blur-lg md:bottom-4">
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1e3050] text-[#7a8ba8] hover:border-[#4a7dff] hover:text-[#4a7dff]"><Heart className="h-4 w-4" /></button>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1e3050] text-[#7a8ba8] hover:border-[#f0c040] hover:text-[#f0c040]"><Share2 className="h-4 w-4" /></button>
        <button className="flex-1 rounded-xl bg-gradient-to-r from-[#4a7dff] to-[#7c5cfc] py-2.5 text-center text-sm font-semibold text-white">지원하기</button>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1e3050] text-[#7a8ba8] hover:border-red-400 hover:text-red-400"><Flag className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
