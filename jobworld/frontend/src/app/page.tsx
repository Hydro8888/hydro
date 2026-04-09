'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { jobsAPI } from '@/lib/api'

type SearchType = '구인' | '구직'

interface RecentJob {
  id: number
  title: string
  company_name: string
  location: string
  salary_range?: string
  job_type: string
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('구인')
  const [stats, setStats] = useState({ totalJobs: 0, totalWorknet: 7000 })
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const router = useRouter()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    jobsAPI.list({ limit: 3 }).then((res) => {
      setStats((s) => ({ ...s, totalJobs: res.data.total || 0 }))
      setRecentJobs(res.data.jobs?.slice(0, 3) || [])
    }).catch(() => {})
  }, [])

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
    <div className="min-h-screen flex flex-col bg-[#f5f7fa]">
      {/* 네비바 */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-[#dfe3e8] relative">
        <span className="flex items-center gap-1.5 select-none shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#1a73e8]" />
          <span className="text-lg font-bold text-[#1c1c1c] tracking-tight">JobWorld</span>
        </span>
        <div className="hidden sm:flex items-center gap-1 absolute left-1/2 -translate-x-1/2 text-sm">
          <Link href="/jobs" className="px-3 py-1.5 text-[#5f6368] hover:text-[#1c1c1c] transition-colors rounded">채용공고</Link>
          <Link href="/search?q=개발자&type=구인" className="px-3 py-1.5 text-[#5f6368] hover:text-[#1c1c1c] transition-colors rounded">AI 검색</Link>
          <Link href="/jobs/post" className="px-3 py-1.5 text-[#5f6368] hover:text-[#1c1c1c] transition-colors rounded">채용 등록</Link>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <span className="hidden sm:block text-[#5f6368] max-w-[100px] truncate">{user.name}</span>
              <button onClick={logout} className="px-4 py-1.5 text-[#1c1c1c] border border-[#dfe3e8] rounded-full hover:border-[#1a73e8] transition-colors">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block px-3 py-1.5 text-[#5f6368] hover:text-[#1c1c1c] transition-colors">로그인</Link>
              <Link href="/register" className="px-4 py-1.5 font-medium text-[#1a73e8] border border-[#1a73e8] rounded-full hover:bg-[#1a73e8] hover:text-white transition-colors">
                회원가입
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="flex-1">
        {/* 히어로 섹션 */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-8">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-[#1c1c1c] leading-[1.05] text-center">
            AI가 찾아주는<br />완벽한 채용과 인재
          </h1>
          <p className="text-center text-[#5f6368] mt-4 text-base max-w-md mx-auto">
            AI가 구인·구직 정보를 분석해 가장 정확한 매칭을 제공합니다.
          </p>
        </section>

        {/* 실시간 통계 배너 */}
        <section className="max-w-6xl mx-auto px-6 pb-8">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#e8f0fe] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#1a73e8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-[#1c1c1c]">{stats.totalWorknet.toLocaleString()}+</p>
                <p className="text-xs text-[#5f6368]">워크넷 공공채용</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#e8f0fe] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#1a73e8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-[#1c1c1c]">AI 검색</p>
                <p className="text-xs text-[#5f6368]">Gemini 기반 분석</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#e8f0fe] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#1a73e8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-[#1c1c1c]">완전 무료</p>
                <p className="text-xs text-[#5f6368]">모든 기능 무제한</p>
              </div>
            </div>
          </div>
        </section>

        {/* 검색 배너 */}
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4285f4 0%, #1a73e8 40%, #6ea8fe 70%, #e8f0fe 100%)', minHeight: '300px' }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 900 300" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <path d="M-20 240 Q150 80 320 170 Q490 260 600 60 Q710 -40 900 100" stroke="white" strokeWidth="1.5" strokeOpacity="0.2" fill="none" />
              <path d="M-20 280 Q200 140 380 210 Q520 260 650 100 Q750 10 920 160" stroke="white" strokeWidth="1" strokeOpacity="0.15" fill="none" />
            </svg>

            <div className="relative z-10 p-8 sm:p-10 max-w-2xl mx-auto text-center">
              <p className="text-sm font-medium text-white/80 mb-3">AI 기반 채용 플랫폼</p>

              <div className="flex justify-center gap-2 mb-4">
                {(['구인', '구직'] as SearchType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSearchType(type)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      searchType === type
                        ? 'bg-white text-[#1a73e8] border-white'
                        : 'text-white/80 border-white/40 hover:border-white/70'
                    }`}
                  >
                    {type === '구인' ? '채용공고 검색' : '인재 검색'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSearch}>
                <div className="flex items-center bg-white rounded-xl px-4 py-3 shadow-lg">
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
                    <button type="button" onClick={() => setQuery('')} className="text-[#9b9b9b] hover:text-[#5f6368] ml-2 shrink-0">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  <button type="submit" className="ml-3 px-5 py-2 bg-[#1a73e8] text-white text-sm font-medium rounded-lg hover:bg-[#1557b0] transition-colors shrink-0">
                    검색
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {quickLinks[searchType].map((link) => (
                  <button
                    key={link.q}
                    type="button"
                    onClick={() => router.push(`/search?q=${encodeURIComponent(link.q)}&type=${encodeURIComponent(searchType)}`)}
                    className="text-xs text-white/80 bg-white/15 border border-white/30 rounded-full px-3 py-1 hover:bg-white/25 transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 역할별 듀얼 CTA 섹션 */}
        {!user && (
          <section className="max-w-6xl mx-auto px-6 pb-12">
            <h2 className="text-2xl font-bold text-[#1c1c1c] text-center mb-2">지금 무료로 시작하세요</h2>
            <p className="text-sm text-[#5f6368] text-center mb-8">가입 후 30초 만에 모든 기능을 이용할 수 있습니다</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 구직자 */}
              <div className="bg-white rounded-2xl p-6 border border-[#dfe3e8] hover:border-[#1a73e8] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[#1a73e8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#1c1c1c] mb-1">구직자이신가요?</h3>
                <p className="text-sm text-[#5f6368] mb-4">AI가 나에 딱 맞는 일자리를 찾아드립니다</p>
                <ul className="space-y-2 mb-5">
                  <li className="flex items-center gap-2 text-sm text-[#5f6368]">
                    <svg className="w-4 h-4 text-[#1a73e8] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    이력서 등록 + AI 맞춤 매칭
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[#5f6368]">
                    <svg className="w-4 h-4 text-[#1a73e8] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    워크넷 {stats.totalWorknet.toLocaleString()}+ 공공채용 검색
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[#5f6368]">
                    <svg className="w-4 h-4 text-[#1a73e8] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    원클릭 입사 지원
                  </li>
                </ul>
                <Link
                  href="/register?type=jobseeker"
                  className="block text-center px-6 py-3 bg-[#1a73e8] text-white text-sm font-medium rounded-xl hover:bg-[#1557b0] transition-colors"
                >
                  무료로 시작하기
                </Link>
              </div>

              {/* 기업/광고주 */}
              <div className="bg-white rounded-2xl p-6 border border-[#dfe3e8] hover:border-[#1a73e8] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#e8f0fe] flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-[#1a73e8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[#1c1c1c] mb-1">기업 · 광고주이신가요?</h3>
                <p className="text-sm text-[#5f6368] mb-4">우수 인재를 AI로 빠르게 찾으세요</p>
                <ul className="space-y-2 mb-5">
                  <li className="flex items-center gap-2 text-sm text-[#5f6368]">
                    <svg className="w-4 h-4 text-[#1a73e8] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    무료 채용공고 등록 (무제한)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[#5f6368]">
                    <svg className="w-4 h-4 text-[#1a73e8] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    AI 인재 매칭 검색
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[#5f6368]">
                    <svg className="w-4 h-4 text-[#1a73e8] shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    지원자 관리 대시보드
                  </li>
                </ul>
                <Link
                  href="/register?type=employer"
                  className="block text-center px-6 py-3 text-[#1a73e8] text-sm font-medium rounded-xl border border-[#1a73e8] hover:bg-[#1a73e8] hover:text-white transition-colors"
                >
                  무료로 채용 등록
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 3단계 이용 방법 */}
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <h2 className="text-2xl font-bold text-[#1c1c1c] text-center mb-8">간단한 3단계로 시작하세요</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#1a73e8] text-white flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
              <h3 className="font-bold text-[#1c1c1c] mb-1">회원가입</h3>
              <p className="text-sm text-[#5f6368]">30초 만에 무료 가입<br />이메일만 있으면 OK</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#1a73e8] text-white flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
              <h3 className="font-bold text-[#1c1c1c] mb-1">이력서 · 채용공고 등록</h3>
              <p className="text-sm text-[#5f6368]">AI가 자동으로 분석하고<br />최적의 매칭을 준비합니다</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#1a73e8] text-white flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
              <h3 className="font-bold text-[#1c1c1c] mb-1">AI 매칭 결과 확인</h3>
              <p className="text-sm text-[#5f6368]">AI가 찾은 최적의 결과를<br />바로 확인하고 지원하세요</p>
            </div>
          </div>
        </section>

        {/* 최근 채용공고 미리보기 */}
        {recentJobs.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 pb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1c1c1c]">최근 채용공고</h2>
              <Link href="/jobs" className="text-sm text-[#1a73e8] hover:underline">전체보기 →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block bg-white border border-[#dfe3e8] rounded-xl p-4 hover:border-[#1a73e8] transition-colors"
                >
                  <h3 className="font-medium text-[#1c1c1c] text-sm truncate">{job.title}</h3>
                  <p className="text-xs text-[#5f6368] mt-1">{job.company_name}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#9b9b9b]">
                    <span>{job.location}</span>
                    {job.salary_range && <span>· {job.salary_range}</span>}
                  </div>
                  <span className="inline-block mt-2 text-xs bg-[#eef1f6] text-[#5f6368] px-2 py-0.5 rounded-full">{job.job_type}</span>
                </Link>
              ))}
            </div>
            {!user && (
              <div className="text-center mt-6">
                <Link href="/register" className="inline-block px-6 py-3 bg-[#1a73e8] text-white text-sm font-medium rounded-xl hover:bg-[#1557b0] transition-colors">
                  지금 가입하고 지원하기
                </Link>
              </div>
            )}
          </section>
        )}
      </main>

      {/* 푸터 위 CTA */}
      {!user && (
        <section className="bg-[#1a73e8] py-10">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-xl font-bold text-white mb-2">지금 바로 시작하세요</h2>
            <p className="text-sm text-white/80 mb-6">모든 기능을 완전 무료로 이용할 수 있습니다</p>
            <div className="flex justify-center gap-3">
              <Link href="/register?type=jobseeker" className="px-6 py-3 bg-white text-[#1a73e8] text-sm font-medium rounded-xl hover:bg-white/90 transition-colors">
                구직자 가입
              </Link>
              <Link href="/register?type=employer" className="px-6 py-3 text-white text-sm font-medium rounded-xl border border-white/60 hover:bg-white/10 transition-colors">
                기업 가입
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 푸터 */}
      <footer className="border-t border-[#dfe3e8] py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]" />
            <span className="text-sm font-bold text-[#1c1c1c]">JobWorld</span>
          </span>
          <div className="flex gap-4 text-xs text-[#5f6368] flex-wrap justify-center">
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
