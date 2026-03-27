import Link from 'next/link';

const MOCK_JOBS = [
  { id: '1', title: '강남 프리미엄 라운지 스탭', region: '서울 강남', payAmount: 500000, payType: 'daily', jobType: '라운지', isUrgent: true },
  { id: '2', title: '홍대 감성 바 서빙', region: '서울 마포', payAmount: 400000, payType: 'daily', jobType: '바', isUrgent: false },
  { id: '3', title: '부산 해운대 클럽 스탭', region: '부산 해운대', payAmount: 350000, payType: 'daily', jobType: '클럽', isUrgent: true },
  { id: '4', title: '압구정 VIP 룸 도우미', region: '서울 강남', payAmount: 600000, payType: 'daily', jobType: '룸', isUrgent: false },
  { id: '5', title: '이태원 프리미엄 라운지', region: '서울 용산', payAmount: 450000, payType: 'daily', jobType: '라운지', isUrgent: false },
  { id: '6', title: '대구 동성로 노래방 도우미', region: '대구 중구', payAmount: 300000, payType: 'daily', jobType: '노래방', isUrgent: true },
];

function formatPay(amount: number, type: string) {
  const formatted = new Intl.NumberFormat('ko-KR').format(amount);
  const typeLabel = type === 'daily' ? '일' : type === 'hourly' ? '시' : '월';
  return `${formatted}원/${typeLabel}`;
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Hero Banner */}
      <section className="relative my-6 overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-card to-accent/20 p-8 md:p-12">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold md:text-4xl">
            안전하고 스마트한
            <span className="block text-primary-light">여우알바</span>
          </h1>
          <p className="mt-3 text-muted-foreground">오늘 바로 시작하세요</p>
          <Link
            href="/jobs"
            className="mt-6 inline-block rounded-full bg-primary px-8 py-3 font-semibold text-white transition-all hover:bg-primary-light hover:shadow-lg hover:shadow-primary/25"
          >
            알바 찾기
          </Link>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
      </section>

      {/* Flash Jobs */}
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            <span className="text-accent">&#9889;</span> 오늘의 번개 공고
          </h2>
          <Link href="/jobs" className="text-sm text-muted-foreground hover:text-primary">
            전체보기 &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_JOBS.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {job.isUrgent && (
                    <span className="mb-2 inline-block rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-medium text-destructive">
                      급구
                    </span>
                  )}
                  <h3 className="font-semibold group-hover:text-primary-light">{job.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{job.region}</p>
                </div>
                <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {job.jobType}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-accent">{formatPay(job.payAmount, job.payType)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Recommendations Placeholder */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold">
          <span className="text-primary">&#10024;</span> AI 맞춤 추천
        </h2>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">프로필을 완성하면 AI가 맞춤 공고를 추천해드려요</p>
          <Link
            href="/register"
            className="mt-4 inline-block rounded-full border border-primary px-6 py-2 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-white"
          >
            프로필 완성하기
          </Link>
        </div>
      </section>

      {/* Region Quick Links */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold">지역별 알바</h2>
        <div className="flex flex-wrap gap-2">
          {['서울', '경기', '인천', '부산', '대구', '대전', '광주', '제주'].map((region) => (
            <Link
              key={region}
              href={`/jobs?region=${region}`}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm transition-all hover:border-primary hover:text-primary"
            >
              {region}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
