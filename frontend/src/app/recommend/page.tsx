import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function RecommendPage() {
  return (
    <div className="mx-auto max-w-[640px] px-4 py-5">
      <h1 className="text-xl font-bold mb-4">AI 맞춤 매칭</h1>
      <div className="card p-6 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-[#C9A961] mb-3" />
        <h2 className="text-lg font-bold">맞춤 일자리 추천</h2>
        <p className="text-sm text-[#999] mt-2">프로필을 80% 이상 완성하면 AI가 딱 맞는 일자리를 추천해드려요</p>
        <div className="mx-auto max-w-[260px] mt-5">
          <div className="h-3 bg-[#f0f0f0] rounded-full overflow-hidden"><div className="h-full w-[30%] bg-gradient-to-r from-[#1E3A5F] to-[#C9A961] rounded-full" /></div>
          <p className="text-sm text-[#999] mt-1.5">완성도 <b className="text-[#C9A961]">30%</b></p>
        </div>
        <div className="mt-5 space-y-2 text-left">
          {[{ t: '희망 지역 설정', d: '어디에서 일하고 싶으세요?' }, { t: '희망 업종 설정', d: '어떤 업종을 선호하세요?' }, { t: '희망 급여 설정', d: '최소 희망 급여를 알려주세요' }].map(i => (
            <Link key={i.t} href="/my/" className="card card-hover flex items-center justify-between p-4">
              <div><p className="text-sm font-medium">{i.t}</p><p className="text-xs text-[#999]">{i.d}</p></div>
              <span className="tag tag-urgent">미완료</span>
            </Link>
          ))}
        </div>
        <Link href="/my/" className="btn btn-gold inline-block mt-5 px-6 py-2.5">프로필 완성하기</Link>
      </div>
    </div>
  );
}
