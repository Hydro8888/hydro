'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'

type SearchType = '구인' | '구직'

export default function Home() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('구인')
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${encodeURIComponent(searchType)}`)
    }
  }

  const quickLinks: Record<SearchType, { label: string; q: string }[]> = {
    구인: [
      { label: '개발자', q: '개발자' },
      { label: '디자이너', q: '디자이너' },
      { label: '재택근무', q: '재택근무' },
      { label: '신입 가능', q: '신입 가능' },
      { label: '주 3일', q: '주 3일 근무' },
      { label: '마케팅', q: '마케팅' },
    ],
    구직: [
      { label: '프론트엔드', q: '프론트엔드 개발자' },
      { label: '백엔드', q: '백엔드 개발자' },
      { label: '경력 3년', q: '경력 3년' },
      { label: 'UI/UX', q: 'UI UX 디자이너' },
      { label: '마케터', q: '마케터' },
      { label: '신입', q: '신입 구직' },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f0eb]">
      {/* 네비바 */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-[#ddd9d0] relative">
        {/* 로고 */}
        <span className="flex items-center gap-1.5 select-none shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#e8623a]" />
          <span className="text-lg font-bold text-[#1c1c1c] tracking-tight">JobWorld</span>
        </span>

        {/* 중앙 링크 */}
        <div className="hidden sm:flex items-center gap-1 absolute left-1/2 -translate-x-1/2 text-sm">
          <Link href="/jobs" className="px-3 py-1.5 text-[#6b6b6b] hover:text-[#1c1c1c] transition-colors rounded">채용공고</Link>
          <Link href="/search?q=개발자&type=구인" className="px-3 py-1.5 text-[#6b6b6b] hover:text-[#1c1c1c] transition-colors rounded">AI 검색</Link>
          <Link href="/jobs/post" className="px-3 py-1.5 text-[#6b6b6b] hover:text-[#1c1c1c] transition-colors rounded">채용 등록</Link>
        </div>

        {/* 우측 */}
        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <span className="hidden sm:block text-[#6b6b6b] max-w-[100px] truncate">{user.name}</span>
              <button
                onClick={logout}
                className="px-4 py-1.5 text-[#1c1c1c] border border-[#ddd9d0] rounded-full hover:border-[#1c1c1c] transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block px-3 py-1.5 text-[#6b6b6b] hover:text-[#1c1c1c] transition-colors">로그인</Link>
              <Link
                href="/register"
                className="px-4 py-1.5 font-medium text-[#1c1c1c] border border-[#1c1c1c] rounded-full hover:bg-[#1c1c1c] hover:text-white transition-colors"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="flex-1">
        {/* 히어로 섹션 */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
          {/* 좌: 대형 타이포 */}
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-[#1c1c1c] leading-[1.05]">
            AI가 찾아주는<br />
            완벽한 채용과<br />
            인재
          </h1>

          {/* 우: CTA + 설명 */}
          <div className="flex flex-col items-start sm:items-end gap-4 sm:pb-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/jobs')}
                className="px-6 py-3 bg-[#eceae3] text-[#1c1c1c] font-medium rounded-xl border border-[#ddd9d0] hover:border-[#1c1c1c] transition-colors text-sm whitespace-nowrap"
              >
                채용공고 둘러보기
              </button>
              <button
                onClick={() => router.push('/search?q=개발자&type=구인')}
                className="w-11 h-11 flex items-center justify-center rounded-full border border-[#ddd9d0] text-[#6b6b6b] hover:border-[#1c1c1c] hover:text-[#1c1c1c] transition-colors bg-[#eceae3]"
                aria-label="AI 검색"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-[#6b6b6b] sm:text-right max-w-[240px]">
              AI가 구인·구직 정보를 분석해<br />
              가장 정확한 매칭을 제공합니다.
            </p>
          </div>
        </section>

        {/* 배너 — 따뜻한 그라디언트 */}
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #f5d394 0%, #f0a67a 40%, #e8c4a0 70%, #f2f0eb 100%)', minHeight: '340px' }}
          >
            {/* SVG 추상 라인 장식 */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 900 340"
              fill="none"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M-20 280 Q150 100 320 200 Q490 300 600 80 Q710 -40 900 120" stroke="#d95f2e" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />
              <path d="M-20 320 Q200 160 380 240 Q520 300 650 120 Q750 20 920 180" stroke="#d95f2e" strokeWidth="1" strokeOpacity="0.35" fill="none" />
              <path d="M100 -20 Q200 120 160 240 Q130 320 200 380" stroke="#d95f2e" strokeWidth="1.2" strokeOpacity="0.4" fill="none" />
              <path d="M300 -10 Q380 80 340 180 Q310 260 380 340" stroke="#d95f2e" strokeWidth="0.8" strokeOpacity="0.3" fill="none" />
              <ellipse cx="420" cy="160" rx="180" ry="100" stroke="#d95f2e" strokeWidth="1" strokeOpacity="0.25" fill="none" transform="rotate(-20 420 160)" />
            </svg>

            {/* 우측 검색 UI 카드 */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 w-64 hidden sm:flex">
              {/* AI 매칭 카드 */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#fef3ee] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#e8623a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1c1c1c]">AI 매칭 완료</p>
                    <p className="text-xs text-[#6b6b6b]">47개 채용공고 발견</p>
                  </div>
                  <div className="ml-auto w-8 h-4 rounded-full bg-[#e8623a] flex items-center justify-end pr-0.5">
                    <div className="w-3 h-3 rounded-full bg-white" />
                  </div>
                </div>
              </div>

              {/* 인재 검색 카드 */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#eceae3] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[#6b6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1c1c1c]">인재 검색</p>
                    <p className="text-xs text-[#6b6b6b]">AI 맞춤 추천 활성화</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-6 h-3 rounded-full bg-[#e8623a] flex items-start p-0.5">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <span className="text-xs text-[#6b6b6b]">활성화됨</span>
                  <Link href="/search?q=개발자&type=구직" className="ml-auto text-xs text-[#e8623a] font-medium hover:underline">
                    검색하기 →
                  </Link>
                </div>
              </div>
            </div>

            {/* 좌측 검색 영역 */}
            <div className="relative z-10 p-8 sm:max-w-[55%]">
              <p className="text-sm font-medium text-[#6b6b6b] mb-4">AI 기반 채용 플랫폼</p>

              {/* 구인/구직 탭 */}
              <div className="flex gap-2 mb-4">
                {(['구인', '구직'] as SearchType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSearchType(type)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      searchType === type
                        ? 'bg-[#1c1c1c] text-white border-[#1c1c1c]'
                        : 'text-[#6b6b6b] border-[#ddd9d0] bg-white/60 hover:bg-white/80'
                    }`}
                  >
                    {type === '구인' ? '채용공고 검색' : '인재 검색'}
                  </button>
                ))}
              </div>

              {/* 검색창 */}
              <form onSubmit={handleSearch}>
                <div className="flex items-center bg-white rounded-xl px-4 py-3 shadow-sm border border-white/80">
                  <svg className="w-4 h-4 text-[#9b9b9b] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchType === '구인' ? '직무, 회사, 기술, 지역...' : '기술스택, 경력, 직종...'}
                    className="flex-1 outline-none text-[#1c1c1c] placeholder-[#9b9b9b] text-sm bg-transparent min-w-0"
                  />
                  {query && (
                    <button type="button" onClick={() => setQuery('')} className="text-[#9b9b9b] hover:text-[#6b6b6b] ml-2 shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="submit"
                    className="ml-3 px-4 py-1.5 bg-[#1c1c1c] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors shrink-0"
                  >
                    검색
                  </button>
                </div>
              </form>

              {/* 빠른 검색 태그 */}
              <div className="flex flex-wrap gap-2 mt-4">
                {quickLinks[searchType].map((link) => (
                  <button
                    key={link.q}
                    type="button"
                    onClick={() => router.push(`/search?q=${encodeURIComponent(link.q)}&type=${encodeURIComponent(searchType)}`)}
                    className="text-xs text-[#6b6b6b] bg-white/70 border border-white/80 rounded-full px-3 py-1 hover:bg-white transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 피처 카드 섹션 */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 카드 1: AI 검색 */}
            <div className="bg-white rounded-2xl p-6 border border-[#ddd9d0]">
              <div className="w-10 h-10 rounded-xl bg-[#fef3ee] flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#e8623a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#1c1c1c] mb-1">AI 스마트 검색</h3>
              <p className="text-sm text-[#6b6b6b] leading-relaxed">
                자연어로 검색하면 AI가 의도를 파악해<br />
                가장 적합한 결과를 찾아드립니다.
              </p>
            </div>

            {/* 카드 2: 보안 & 신뢰 */}
            <div className="bg-white rounded-2xl p-6 border border-[#ddd9d0]">
              <div className="w-10 h-10 rounded-xl bg-[#f5f3ee] flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#6b6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#1c1c1c] mb-1">신뢰할 수 있는 채용</h3>
              <p className="text-sm text-[#6b6b6b] leading-relaxed">
                검증된 기업과 실제 채용공고만 제공.<br />
                개인정보는 안전하게 보호됩니다.
              </p>
            </div>

            {/* 카드 3: 실시간 */}
            <div className="bg-white rounded-2xl p-6 border border-[#ddd9d0]">
              <div className="w-10 h-10 rounded-xl bg-[#fef3ee] flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#e8623a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#1c1c1c] mb-1">실시간 채용 정보</h3>
              <p className="text-sm text-[#6b6b6b] leading-relaxed">
                워크넷, 사람인 등 주요 채용 플랫폼의<br />
                최신 정보를 실시간으로 수집합니다.
              </p>
            </div>

            {/* 카드 4: 무료 */}
            <div className="bg-white rounded-2xl p-6 border border-[#ddd9d0]">
              <div className="w-10 h-10 rounded-xl bg-[#f5f3ee] flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[#6b6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#1c1c1c] mb-1">완전 무료 서비스</h3>
              <p className="text-sm text-[#6b6b6b] leading-relaxed">
                구인·구직 등록부터 AI 검색까지<br />
                모든 기능을 무료로 이용하세요.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-[#ddd9d0] py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e8623a]" />
            <span className="text-sm font-bold text-[#1c1c1c]">JobWorld</span>
          </span>
          <div className="flex gap-4 text-xs text-[#6b6b6b] flex-wrap justify-center">
            <Link href="/jobs" className="hover:text-[#1c1c1c] transition-colors">채용공고</Link>
            <Link href="/jobs/post" className="hover:text-[#1c1c1c] transition-colors">채용 등록</Link>
            <Link href="/resume/new" className="hover:text-[#1c1c1c] transition-colors">이력서 등록</Link>
            <Link href="/about" className="hover:text-[#1c1c1c] transition-colors">소개</Link>
            <Link href="/privacy" className="hover:text-[#1c1c1c] transition-colors">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-[#1c1c1c] transition-colors">이용약관</Link>
          </div>
          <p className="text-xs text-[#9b9b9b]">© 2026 AI JobWorld</p>
        </div>
      </footer>
    </div>
  )
}
