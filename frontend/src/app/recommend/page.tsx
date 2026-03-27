import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function RecommendPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <h1 className="mb-4 text-xl font-bold">AI 맞춤 매칭</h1>
      <div className="card p-6 text-center">
        <Sparkles className="mx-auto mb-3 h-10 w-10 text-[#C9A961]" />
        <h2 className="text-lg font-bold">맞춤 일자리 추천</h2>
        <p className="mt-2 text-sm text-[#94A3B8]">프로필을 80% 이상 완성하면<br />AI가 딱 맞는 일자리를 추천해드려요</p>
        <div className="mx-auto mt-5 max-w-xs">
          <div className="h-2.5 overflow-hidden rounded-full bg-[#112240]">
            <div className="h-full w-[30%] rounded-full bg-gradient-to-r from-[#1E3A5F] to-[#C9A961]" />
          </div>
          <p className="mt-1.5 text-sm text-[#94A3B8]">완성도 <span className="font-bold text-[#C9A961]">30%</span></p>
        </div>
        <div className="mt-5 space-y-2 text-left">
          {[{ t: '희망 지역 설정', d: '어디에서 일하고 싶으세요?' }, { t: '희망 업종 설정', d: '어떤 업종을 선호하세요?' }, { t: '희망 급여 설정', d: '최소 희망 급여를 알려주세요' }].map(i => (
            <Link key={i.t} href="/my/" className="card-sm flex items-center justify-between p-3.5 transition hover:border-[#1E3A5F]/50">
              <div><p className="text-sm font-medium">{i.t}</p><p className="text-xs text-[#64748B]">{i.d}</p></div>
              <span className="text-[10px] text-[#F59E0B]">미완료</span>
            </Link>
          ))}
        </div>
        <Link href="/my/" className="btn btn-gold mt-5 inline-block px-6 py-2.5">프로필 완성하기</Link>
      </div>
    </div>
  );
}
