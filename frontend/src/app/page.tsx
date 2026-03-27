import Link from 'next/link';
import { Shield, Sparkles, MapPin, Zap, Clock, ArrowRight } from 'lucide-react';

const JOBS = [
  { id: '1', title: '강남 프리미엄 라운지 스탭', co: '강남 프리미엄', region: '서울 강남', pay: '일 50만', type: '라운지', urgent: true, verified: true },
  { id: '2', title: '홍대 감성 바 서빙', co: '홍대 감성바', region: '서울 마포', pay: '일 40만', type: '바', urgent: false, verified: false },
  { id: '3', title: '해운대 클럽 스탭', co: '해운대 나이트', region: '부산', pay: '일 35만', type: '클럽', urgent: true, verified: true },
  { id: '4', title: '압구정 VIP 룸 도우미', co: '압구정 VIP', region: '서울 강남', pay: '일 60만', type: '룸', urgent: false, verified: true },
  { id: '5', title: '이태원 프리미엄 라운지', co: '이태원 라운지', region: '서울 용산', pay: '일 45만', type: '라운지', urgent: false, verified: false },
  { id: '6', title: '대구 동성로 노래방 도우미', co: '동성로 노래방', region: '대구', pay: '일 30만', type: '노래방', urgent: true, verified: false },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="card relative my-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A5F]/20 via-transparent to-[#C9A961]/10" />
        <div className="relative px-6 py-8 md:px-10 md:py-12">
          <p className="mb-1 text-sm font-medium text-[#C9A961]">여성 전문 구인구직</p>
          <h1 className="text-2xl font-bold md:text-4xl">
            신뢰할 수 있는<br />
            <span className="text-[#C9A961]">프리미엄 일자리</span>를 찾아보세요
          </h1>
          <p className="mt-3 text-sm text-[#94A3B8]">성인인증 · AI매칭 · 안전보장, 여우알바</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/jobs/" className="btn btn-gold px-6 py-2.5">채용정보 보기</Link>
            <Link href="/register/" className="btn btn-outline px-6 py-2.5">회원가입</Link>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mb-6 grid grid-cols-3 gap-2">
        {[
          { icon: Shield, label: '안전 인증', desc: '본인인증 필수', color: '#10B981' },
          { icon: Sparkles, label: 'AI 매칭', desc: '맞춤 추천', color: '#C9A961' },
          { icon: Clock, label: '실시간', desc: '즉시 알림', color: '#94A3B8' },
        ].map(({ icon: I, label, desc, color }) => (
          <div key={label} className="card-sm flex flex-col items-center p-3 text-center">
            <I className="mb-1.5 h-5 w-5" style={{ color }} />
            <p className="text-xs font-semibold">{label}</p>
            <p className="text-[10px] text-[#64748B]">{desc}</p>
          </div>
        ))}
      </section>

      {/* Jobs */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-lg font-bold"><Zap className="h-4 w-4 text-[#C9A961]" /> 지금 뜨는 채용</h2>
          <Link href="/jobs/" className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#C9A961]">전체보기 <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {JOBS.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}/`} className="card-sm group flex gap-3 p-3.5 transition hover:border-[#1E3A5F]/60">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#112240]">
                <div className="flex h-full items-center justify-center text-2xl opacity-30">🦊</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1">
                  {j.urgent && <span className="tag bg-[#F59E0B]/15 text-[#F59E0B]">급구</span>}
                  {j.verified && <span className="tag bg-[#10B981]/15 text-[#10B981]">인증</span>}
                  <span className="tag bg-[#1E3A5F]/20 text-[#94A3B8]">{j.type}</span>
                </div>
                <h3 className="truncate text-sm font-semibold group-hover:text-[#C9A961]">{j.title}</h3>
                <p className="mt-0.5 text-xs text-[#64748B]">{j.co}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-[#94A3B8]"><MapPin className="h-3 w-3" />{j.region}</span>
                  <span className="text-sm font-bold text-[#C9A961]">{j.pay}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Region */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold">지역별 채용</h2>
        <div className="flex flex-wrap gap-2">
          {['서울', '경기', '인천', '부산', '대구', '대전', '광주', '제주'].map(r => (
            <Link key={r} href={`/jobs/?region=${r}`} className="card-sm px-4 py-2 text-sm text-[#94A3B8] transition hover:border-[#1E3A5F]/50 hover:text-[#C9A961]">{r}</Link>
          ))}
        </div>
      </section>

      {/* AI */}
      <section className="mb-6">
        <div className="card overflow-hidden bg-gradient-to-r from-[#1E3A5F]/10 to-[#C9A961]/5 p-6 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-[#C9A961]" />
          <h2 className="font-bold">AI 맞춤 매칭</h2>
          <p className="mt-1.5 text-sm text-[#94A3B8]">프로필을 완성하면 나에게 딱 맞는 일자리를 추천해드려요</p>
          <Link href="/register/" className="btn btn-navy mt-4 inline-block px-6 py-2.5">시작하기</Link>
        </div>
      </section>

      {/* Safety */}
      <section className="mb-8">
        <div className="card-sm flex items-center gap-3 border-[#10B981]/20 p-4">
          <Shield className="h-8 w-8 shrink-0 text-[#10B981]" />
          <div>
            <p className="text-sm font-semibold text-[#10B981]">안전한 여우알바</p>
            <p className="mt-0.5 text-xs text-[#94A3B8]">성인인증 필수 · AI 허위공고 필터링 · 24시간 안전 지원</p>
          </div>
        </div>
      </section>
    </div>
  );
}
