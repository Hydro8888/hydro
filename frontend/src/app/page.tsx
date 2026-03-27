import Link from 'next/link';

const TOP3 = [
  { id: '4', rank: 2, title: '압구정 VIP 룸', region: '서울 강남', pay: '600,000원/일', color: 'from-[#a8b4c8] to-[#c8d4e8]', size: 'h-16 w-16', textSize: 'text-xl' },
  { id: '1', rank: 1, title: '강남 프리미엄 라운지', region: '서울 강남', pay: '500,000원/일', color: 'from-[#f0c040] to-[#ffdb70]', size: 'h-20 w-20', textSize: 'text-2xl' },
  { id: '3', rank: 3, title: '해운대 클럽 스탭', region: '부산', pay: '350,000원/일', color: 'from-[#cd7f32] to-[#e8a060]', size: 'h-16 w-16', textSize: 'text-xl' },
];

const JOBS = [
  { id: '2', rank: 4, title: '홍대 감성 바 서빙', region: '서울 마포', pay: '400,000원/일', type: '바', urgent: false },
  { id: '5', rank: 5, title: '이태원 프리미엄 라운지', region: '서울 용산', pay: '450,000원/일', type: '라운지', urgent: false },
  { id: '6', rank: 6, title: '대구 동성로 노래방', region: '대구', pay: '300,000원/일', type: '노래방', urgent: true },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="glass relative my-5 overflow-hidden p-6 md:p-10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#4a7dff]/8 blur-[60px]" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#7c5cfc]/8 blur-[60px]" />
        <div className="relative">
          <h1 className="text-2xl font-bold md:text-3xl">
            안전하고 스마트한
            <span className="mt-1 block bg-gradient-to-r from-[#4a7dff] to-[#7c5cfc] bg-clip-text text-transparent">여우알바</span>
          </h1>
          <p className="mt-2 text-sm text-[#7a8ba8]">오늘 바로 시작하세요</p>
          <Link href="/jobs/" className="mt-5 inline-block rounded-xl bg-gradient-to-r from-[#4a7dff] to-[#7c5cfc] px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
            알바 찾기
          </Link>
        </div>
      </section>

      {/* TOP 3 Podium */}
      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold"><span className="text-[#f0c040]">TOP</span> 인기 공고</h2>
          <Link href="/jobs/" className="text-xs text-[#7a8ba8] hover:text-[#4a7dff]">전체보기 &rarr;</Link>
        </div>
        <div className="glass flex items-end justify-center gap-6 px-4 py-6">
          {TOP3.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}/`} className="flex flex-col items-center text-center">
              {job.rank === 1 && <span className="mb-1 text-lg">👑</span>}
              {job.rank === 2 && <span className="mb-1 text-base">🥈</span>}
              {job.rank === 3 && <span className="mb-1 text-base">🥉</span>}
              <div className={`${job.size} flex items-center justify-center rounded-2xl bg-gradient-to-br ${job.color} ${job.rank === 1 ? 'shadow-lg shadow-[#f0c040]/20' : ''}`} style={{ transform: 'rotate(45deg)' }}>
                <span className={`${job.textSize} font-bold text-[#070d1a]`} style={{ transform: 'rotate(-45deg)' }}>{job.rank}</span>
              </div>
              <p className="mt-2.5 max-w-[100px] text-xs font-medium leading-tight">{job.title}</p>
              <p className="mt-0.5 text-[10px] text-[#4a5d7a]">{job.region}</p>
              <p className="mt-0.5 text-xs font-bold text-[#f0c040]">{job.pay}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Job Ranking List */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold">오늘의 번개 공고</h2>
        <div className="space-y-2">
          {JOBS.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}/`} className="glass-sm flex items-center gap-3 px-4 py-3 transition hover:bg-[#1a2a4a]/60">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#111d35] text-sm font-bold text-[#7a8ba8]">{job.rank}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {job.urgent && <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-400">급구</span>}
                  <h3 className="truncate text-sm font-medium">{job.title}</h3>
                </div>
                <p className="text-[11px] text-[#4a5d7a]">{job.region}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-[#f0c040]">{job.pay}</p>
                <p className="text-[10px] text-[#4a5d7a]">{job.type}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Recommend */}
      <section className="mb-6">
        <div className="glass p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4a7dff] to-[#7c5cfc] text-xl">✨</div>
          <h2 className="font-semibold">AI 맞춤 추천</h2>
          <p className="mt-1.5 text-sm text-[#7a8ba8]">프로필을 완성하면 AI가 맞춤 공고를 추천해드려요</p>
          <Link href="/register/" className="mt-4 inline-block rounded-xl border border-[#4a7dff] px-5 py-2 text-sm font-medium text-[#4a7dff] transition hover:bg-[#4a7dff] hover:text-white">
            프로필 완성하기
          </Link>
        </div>
      </section>

      {/* Regions */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">지역별 알바</h2>
        <div className="flex flex-wrap gap-2">
          {['서울', '경기', '인천', '부산', '대구', '대전', '광주', '제주'].map((r) => (
            <Link key={r} href={`/jobs/?region=${r}`} className="glass-sm px-4 py-2 text-sm text-[#7a8ba8] transition hover:border-[#4a7dff]/40 hover:text-[#4a7dff]">
              {r}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
