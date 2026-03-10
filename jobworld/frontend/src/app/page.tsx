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
    <div className="min-h-screen flex flex-col bg-white">
      {/* 상단 네비 */}
      <nav className="flex justify-between items-center px-6 py-3 text-sm border-b border-[#dadce0]">
        <span className="flex items-center text-xl font-medium select-none">
          <span className="text-[#1a73e8] font-bold">Job</span>
          <span className="text-[#ea4335] font-bold">W</span>
          <span className="text-[#fbbc04] font-bold">o</span>
          <span className="text-[#34a853] font-bold">r</span>
          <span className="text-[#1a73e8] font-bold">ld</span>
        </span>
        <div className="flex items-center gap-1">
          <Link href="/jobs/post" className="px-3 py-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] rounded transition-colors">
            채용 등록
          </Link>
          <Link href="/resume/new" className="px-3 py-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] rounded transition-colors">
            이력서 등록
          </Link>
          {user ? (
            <>
              <span className="px-3 py-1.5 text-[#5f6368]">{user.name}</span>
              <button onClick={logout} className="px-3 py-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] rounded transition-colors">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] rounded transition-colors">
                로그인
              </Link>
              <Link href="/register" className="ml-1 px-4 py-2 bg-[#1a73e8] text-white text-sm font-medium rounded hover:bg-[#1557b0] transition-colors">
                회원가입
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* 메인 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <h1 className="flex items-center justify-center text-7xl font-medium select-none mb-6">
            <span className="text-[#4285f4]">J</span>
            <span className="text-[#ea4335]">o</span>
            <span className="text-[#fbbc04]">b</span>
            <span className="text-[#4285f4]">W</span>
            <span className="text-[#34a853]">o</span>
            <span className="text-[#ea4335]">r</span>
            <span className="text-[#4285f4]">l</span>
            <span className="text-[#fbbc04]">d</span>
          </h1>
          <p className="text-[#5f6368] text-base">
            AI가 찾아주는 가장 정확한 일자리와 인재 &nbsp;·&nbsp;
            <span className="text-[#188038] font-medium">완전 무료</span>
          </p>
        </div>

        {/* 구인/구직 탭 */}
        <div className="flex gap-2 mb-4">
          {(['구인', '구직'] as SearchType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSearchType(type)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all border ${
                searchType === type
                  ? 'bg-[#1a73e8] text-white border-[#1a73e8]'
                  : 'text-[#5f6368] border-[#dadce0] hover:bg-[#f8f9fa]'
              }`}
            >
              {type === '구인' ? '구인 검색' : '구직자 검색'}
            </button>
          ))}
        </div>

        {/* 검색창 */}
        <form onSubmit={handleSearch} className="w-full max-w-xl">
          <div className="flex items-center border border-[#dadce0] rounded-full px-5 py-3 hover:shadow-md focus-within:shadow-md transition-shadow bg-white">
            <svg className="w-5 h-5 text-[#9aa0a6] mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchType === '구인' ? '직무, 회사, 기술, 지역으로 검색...' : '기술스택, 경력, 직종으로 구직자 검색...'}
              className="flex-1 outline-none text-[#202124] placeholder-[#9aa0a6] text-base bg-transparent"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-[#9aa0a6] hover:text-[#5f6368] mr-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          {/* 검색 버튼 */}
          <div className="flex justify-center gap-3 mt-5">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#f8f9fa] text-[#3c4043] text-sm font-medium rounded border border-[#f8f9fa] hover:border-[#dadce0] hover:shadow-sm transition-all"
            >
              AI 검색
            </button>
            <button
              type="button"
              onClick={() => {
                if (query.trim()) {
                  router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${encodeURIComponent(searchType)}`)
                } else {
                  router.push('/jobs')
                }
              }}
              className="px-6 py-2.5 bg-[#f8f9fa] text-[#3c4043] text-sm font-medium rounded border border-[#f8f9fa] hover:border-[#dadce0] hover:shadow-sm transition-all"
            >
              채용공고 보기
            </button>
          </div>
        </form>

        {/* 빠른 검색 태그 */}
        <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-xl">
          {quickLinks[searchType].map((link) => (
            <button
              key={link.q}
              type="button"
              onClick={() => router.push(`/search?q=${encodeURIComponent(link.q)}&type=${encodeURIComponent(searchType)}`)}
              className="text-sm text-[#5f6368] border border-[#dadce0] rounded-full px-3.5 py-1 hover:bg-[#f8f9fa] transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-[#dadce0] bg-[#f8f9fa] py-4">
        <div className="flex justify-center gap-6 text-xs text-[#5f6368] flex-wrap">
          <Link href="/jobs" className="hover:text-[#202124] transition-colors">채용공고</Link>
          <Link href="/jobs/post" className="hover:text-[#202124] transition-colors">채용 등록</Link>
          <Link href="/resume/new" className="hover:text-[#202124] transition-colors">이력서 등록</Link>
          <Link href="/privacy" className="hover:text-[#202124] transition-colors">개인정보처리방침</Link>
          <Link href="/terms" className="hover:text-[#202124] transition-colors">이용약관</Link>
          <Link href="/admin.html" className="hover:text-[#202124] transition-colors">관리자</Link>
        </div>
        <p className="text-center text-xs text-[#80868b] mt-3">© 2026 AI JobWorld</p>
      </footer>
    </div>
  )
}
