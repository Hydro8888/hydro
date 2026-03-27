import Link from 'next/link';

const TOP_JOBS = [
  { id: '1', rank: 1, title: '강남 프리미엄 라운지', region: '서울 강남', pay: 500000, type: '라운지', emoji: '👑' },
  { id: '4', rank: 2, title: '압구정 VIP 룸', region: '서울 강남', pay: 600000, type: '룸', emoji: '🥈' },
  { id: '3', rank: 3, title: '해운대 클럽 스탭', region: '부산', pay: 350000, type: '클럽', emoji: '🥉' },
];

const OTHER_JOBS = [
  { id: '2', rank: 4, title: '홍대 감성 바 서빙', region: '서울 마포', pay: 400000, type: '바', isUrgent: false },
  { id: '5', rank: 5, title: '이태원 프리미엄 라운지', region: '서울 용산', pay: 450000, type: '라운지', isUrgent: false },
  { id: '6', rank: 6, title: '대구 동성로 노래방', region: '대구', pay: 300000, type: '노래방', isUrgent: true },
];

function formatPay(n: number) { return new Intl.NumberFormat('ko-KR').format(n) + '원/일'; }

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Hero */}
      <section className="glass relative my-6 overflow-hidden p-8 md:p-12">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-blue)]/10 via-transparent to-[var(--accent-purple)]/10" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[var(--accent-blue)]/10 blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-[var(--accent-purple)]/10 blur-[80px]" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold md:text-4xl">
            안전하고 스마트한
            <span className="block text-gradient">여우알바</span>
          </h1>
          <p className="mt-3 text-[var(--text-secondary)]">오늘 바로 시작하세요</p>
          <Link
            href="/jobs/"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-purple)] px-8 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-[var(--accent-blue)]/30"
          >
            알바 찾기
          </Link>
        </div>
      </section>

      {/* Top 3 Podium (Leaderboard Style) */}
      <section className="mb-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            <span className="text-gradient-gold">TOP</span> 인기 공고
          </h2>
          <Link href="/jobs/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-blue)]">
            전체보기 &rarr;
          </Link>
        </div>

        <div className="flex items-end justify-center gap-3 px-4 pb-4">
          {/* 2nd Place */}
          <Link href={`/jobs/${TOP_JOBS[1].id}/`} className="flex w-1/3 flex-col items-center">
            <div className="mb-2 text-2xl">{TOP_JOBS[1].emoji}</div>
            <div className="diamond flex h-20 w-20 items-center justify-center bg-gradient-to-br from-[#a8b4c8] to-[#c8d4e8] shadow-lg md:h-24 md:w-24">
              <span className="text-2xl font-bold text-[var(--bg-primary)]">2</span>
            </div>
            <p className="mt-3 text-center text-xs font-medium leading-tight md:text-sm">{TOP_JOBS[1].title}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{TOP_JOBS[1].region}</p>
            <p className="mt-1 text-xs font-bold text-[var(--accent-gold)]">{formatPay(TOP_JOBS[1].pay)}</p>
          </Link>

          {/* 1st Place */}
          <Link href={`/jobs/${TOP_JOBS[0].id}/`} className="flex w-1/3 flex-col items-center">
            <div className="mb-2 text-3xl">{TOP_JOBS[0].emoji}</div>
            <div className="diamond glow-gold flex h-24 w-24 items-center justify-center bg-gradient-to-br from-[#f0c040] to-[#ffdb70] shadow-xl md:h-28 md:w-28">
              <span className="text-3xl font-bold text-[var(--bg-primary)]">1</span>
            </div>
            <p className="mt-3 text-center text-sm font-semibold leading-tight md:text-base">{TOP_JOBS[0].title}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{TOP_JOBS[0].region}</p>
            <p className="mt-1 text-sm font-bold text-[var(--accent-gold)]">{formatPay(TOP_JOBS[0].pay)}</p>
          </Link>

          {/* 3rd Place */}
          <Link href={`/jobs/${TOP_JOBS[2].id}/`} className="flex w-1/3 flex-col items-center">
            <div className="mb-2 text-2xl">{TOP_JOBS[2].emoji}</div>
            <div className="diamond flex h-20 w-20 items-center justify-center bg-gradient-to-br from-[#cd7f32] to-[#e8a060] shadow-lg md:h-24 md:w-24">
              <span className="text-2xl font-bold text-[var(--bg-primary)]">3</span>
            </div>
            <p className="mt-3 text-center text-xs font-medium leading-tight md:text-sm">{TOP_JOBS[2].title}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{TOP_JOBS[2].region}</p>
            <p className="mt-1 text-xs font-bold text-[var(--accent-gold)]">{formatPay(TOP_JOBS[2].pay)}</p>
          </Link>
        </div>
      </section>

      {/* Ranking List */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">오늘의 번개 공고</h2>
        <div className="space-y-2">
          {OTHER_JOBS.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}/`}
              className="glass flex items-center gap-4 p-4 transition-all hover:border-[var(--border-active)] hover:bg-[var(--bg-card-hover)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-card)] text-sm font-bold text-[var(--text-secondary)]">
                {job.rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {job.isUrgent && (
                    <span className="shrink-0 rounded-md bg-[var(--danger)]/20 px-1.5 py-0.5 text-[10px] font-medium text-[var(--danger)]">급구</span>
                  )}
                  <h3 className="truncate text-sm font-medium">{job.title}</h3>
                </div>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{job.region}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-sm font-bold text-[var(--accent-gold)]">{formatPay(job.pay)}</span>
                <span className="block text-[10px] text-[var(--text-muted)]">{job.type}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Recommendation */}
      <section className="mb-8">
        <div className="glass overflow-hidden p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)]">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="text-lg font-semibold">AI 맞춤 추천</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            프로필을 완성하면 AI가 맞춤 공고를 추천해드려요
          </p>
          <Link
            href="/register/"
            className="mt-4 inline-block rounded-xl border border-[var(--accent-blue)] px-6 py-2.5 text-sm font-medium text-[var(--accent-blue)] transition-all hover:bg-[var(--accent-blue)] hover:text-white"
          >
            프로필 완성하기
          </Link>
        </div>
      </section>

      {/* Region Quick Links */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold">지역별 알바</h2>
        <div className="flex flex-wrap gap-2">
          {['서울', '경기', '인천', '부산', '대구', '대전', '광주', '제주'].map((region) => (
            <Link
              key={region}
              href={`/jobs/?region=${region}`}
              className="glass px-4 py-2 text-sm text-[var(--text-secondary)] transition-all hover:border-[var(--accent-blue)]/40 hover:text-[var(--accent-blue)]"
            >
              {region}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
