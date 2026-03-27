import Link from 'next/link';
import { Shield, Star, MapPin, Clock, Zap } from 'lucide-react';

const HOT = [
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#e85d8a]/10 via-transparent to-[#c44dbb]/10" />
        <div className="relative px-6 py-8 md:px-10 md:py-12">
          <p className="mb-1 text-sm font-medium text-[#e85d8a]">안전하고 스마트한</p>
          <h1 className="text-3xl font-bold md:text-4xl">
            나에게 딱 맞는<br />
            <span className="bg-gradient-to-r from-[#e85d8a] to-[#d4a76a] bg-clip-text text-transparent">고소득 알바</span>를 찾아보세요
          </h1>
          <p className="mt-3 text-sm text-[#9a8aa8]">전국 유흥알바 정보를 한눈에, 여우알바</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/jobs/" className="btn-primary px-6 py-2.5 text-sm">알바 찾기</Link>
            <Link href="/register/" className="rounded-xl border border-[#e85d8a]/30 px-6 py-2.5 text-sm font-medium text-[#e85d8a] transition hover:bg-[#e85d8a]/10">회원가입</Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="mb-6 grid grid-cols-3 gap-2">
        {[
          { icon: Shield, label: '안전 인증', desc: '성인인증 필수', color: '#4ade80' },
          { icon: Star, label: 'AI 매칭', desc: '맞춤 추천', color: '#e85d8a' },
          { icon: Zap, label: '실시간', desc: '즉시 알림', color: '#d4a76a' },
        ].map(({ icon: I, label, desc, color }) => (
          <div key={label} className="card-sm flex flex-col items-center p-3 text-center">
            <I className="mb-1.5 h-5 w-5" style={{ color }} />
            <p className="text-xs font-semibold">{label}</p>
            <p className="text-[10px] text-[#6a5a7a]">{desc}</p>
          </div>
        ))}
      </section>

      {/* Hot Jobs */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-lg font-bold">
            <Zap className="h-4 w-4 text-[#d4a76a]" /> 지금 뜨는 공고
          </h2>
          <Link href="/jobs/" className="text-xs text-[#9a8aa8] hover:text-[#e85d8a]">전체보기 &rarr;</Link>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {HOT.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}/`} className="card-sm group flex gap-3 p-3.5 transition hover:border-[#e85d8a]/30">
              {/* Thumbnail placeholder */}
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#1e142a] to-[#2a1e3a]">
                <div className="flex h-full items-center justify-center text-2xl opacity-40">🦊</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1">
                  {j.urgent && <span className="tag bg-[#ff6b6b]/15 text-[#ff6b6b]">급구</span>}
                  {j.verified && <span className="tag bg-[#4ade80]/15 text-[#4ade80]">인증</span>}
                  <span className="tag bg-[#1e142a] text-[#9a8aa8]">{j.type}</span>
                </div>
                <h3 className="truncate text-sm font-semibold group-hover:text-[#e85d8a]">{j.title}</h3>
                <p className="mt-0.5 text-xs text-[#6a5a7a]">{j.co}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-[#9a8aa8]"><MapPin className="h-3 w-3" />{j.region}</span>
                  <span className="text-sm font-bold text-[#d4a76a]">{j.pay}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Region Quick */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold">지역별 알바</h2>
        <div className="flex flex-wrap gap-2">
          {['서울', '경기', '인천', '부산', '대구', '대전', '광주', '제주'].map((r) => (
            <Link key={r} href={`/jobs/?region=${r}`} className="card-sm px-4 py-2 text-sm text-[#9a8aa8] transition hover:border-[#e85d8a]/30 hover:text-[#e85d8a]">{r}</Link>
          ))}
        </div>
      </section>

      {/* AI Match CTA */}
      <section className="mb-6">
        <div className="card overflow-hidden bg-gradient-to-r from-[#e85d8a]/5 to-[#c44dbb]/5 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e85d8a] to-[#c44dbb] text-xl">✨</div>
          <h2 className="font-bold">AI 맞춤 추천</h2>
          <p className="mt-1.5 text-sm text-[#9a8aa8]">프로필을 완성하면 나에게 딱 맞는 공고를 추천해드려요</p>
          <Link href="/register/" className="btn-primary mt-4 inline-block px-6 py-2.5 text-sm">시작하기</Link>
        </div>
      </section>

      {/* Safety Banner */}
      <section className="mb-8">
        <div className="card-sm flex items-center gap-3 border-[#4ade80]/20 p-4">
          <Shield className="h-8 w-8 shrink-0 text-[#4ade80]" />
          <div>
            <p className="text-sm font-semibold text-[#4ade80]">안전한 여우알바</p>
            <p className="mt-0.5 text-xs text-[#9a8aa8]">성인인증 필수 &middot; AI 허위공고 필터링 &middot; 24시간 SOS 지원</p>
          </div>
        </div>
      </section>
    </div>
  );
}
