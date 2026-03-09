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

  const placeholders: Record<SearchType, string> = {
    구인: '직무, 회사, 기술, 지역으로 채용공고 검색...',
    구직: '기술스택, 경력, 직종으로 구직자 검색...',
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── 상단 네비게이션 ── */}
      <nav className="relative z-20 flex justify-between items-center px-6 py-3 text-sm">
        <span className="text-base font-bold">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI </span>
          <span className="text-blue-600">Job</span>
          <span className="text-gray-800">World</span>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/jobs/post" className="text-gray-500 hover:text-gray-900 transition-colors">채용 등록</Link>
          <Link href="/resume/new" className="text-gray-500 hover:text-gray-900 transition-colors">이력서 등록</Link>
          {user ? (
            <>
              <span className="text-gray-600">{user.name}</span>
              <button onClick={logout} className="text-gray-500 hover:text-gray-900 transition-colors">로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-500 hover:text-gray-900 transition-colors">로그인</Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors font-medium"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── 메인 컨텐츠 ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        {/* 로고 & 헤드라인 */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI</span>
            {' '}
            <span className="text-blue-600">Job</span>
            <span className="text-gray-900">World</span>
          </h1>
          <p className="mt-4 text-xl font-semibold text-gray-800">
            AI가 찾아주는 가장 정확한 일자리와 인재
          </p>
          <p className="mt-2 text-sm text-gray-500 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-0.5 rounded-full text-xs font-semibold">
              ✓ 완전 무료
            </span>
            구인 등록부터 구직 등록, AI 검색까지 누구나 완전 무료
          </p>
        </div>

        {/* 구인 / 구직 탭 */}
        <div className="flex bg-gray-100 rounded-full p-1 mb-4 gap-1">
          {(['구인', '구직'] as SearchType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSearchType(type)}
              className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all ${
                searchType === type
                  ? type === '구인'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-purple-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type === '구인' ? '🏢 구인 찾기' : '👤 구직 찾기'}
            </button>
          ))}
        </div>

        {/* 검색창 */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl">
          <div className={`flex items-center border-2 rounded-full px-5 py-3 shadow-sm hover:shadow-md transition-all bg-white ${
            searchType === '구인'
              ? 'border-blue-300 focus-within:border-blue-500'
              : 'border-purple-300 focus-within:border-purple-500'
          }`}>
            <svg className="w-5 h-5 text-gray-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholders[searchType]}
              className="flex-1 outline-none text-gray-800 placeholder-gray-400 text-base bg-transparent"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 mr-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <button
              type="submit"
              className={`text-white px-6 py-2 rounded-full text-sm font-semibold shrink-0 transition-colors ${
                searchType === '구인' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              AI 검색
            </button>
          </div>
        </form>

        {/* 빠른 검색 태그 */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center max-w-2xl">
          {quickLinks[searchType].map((link) => (
            <button
              key={link.q}
              type="button"
              onClick={() => router.push(`/search?q=${encodeURIComponent(link.q)}&type=${encodeURIComponent(searchType)}`)}
              className={`text-sm border rounded-full px-3.5 py-1 transition-colors ${
                searchType === '구인'
                  ? 'text-blue-600 border-blue-200 hover:bg-blue-50'
                  : 'text-purple-600 border-purple-200 hover:bg-purple-50'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* CTA 버튼 */}
        <div className="flex flex-wrap gap-3 mt-8 justify-center">
          <Link href="/jobs"
            className="text-sm text-gray-600 border border-gray-200 rounded-full px-5 py-2 hover:bg-gray-50 transition-colors">
            채용공고 보기
          </Link>
          <Link href="/jobs/post"
            className="text-sm text-white bg-blue-600 rounded-full px-5 py-2 hover:bg-blue-700 transition-colors font-medium">
            채용공고 등록 (무료)
          </Link>
          <Link href="/resume/new"
            className="text-sm text-white bg-purple-600 rounded-full px-5 py-2 hover:bg-purple-700 transition-colors font-medium">
            이력서 등록 (무료)
          </Link>
        </div>
      </main>

      {/* ── 푸터 ── */}
      <footer className="relative z-10 text-center text-xs text-gray-400 py-5 space-y-1">
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/jobs" className="hover:text-gray-600">채용공고</Link>
          <Link href="/privacy" className="hover:text-gray-600">개인정보처리방침</Link>
          <Link href="/terms" className="hover:text-gray-600">이용약관</Link>
          <Link href="/admin" className="hover:text-gray-600">관리자</Link>
        </div>
        <p>© 2026 AI JobWorld. AI 기반 구인·구직 플랫폼. 완전 무료.</p>
      </footer>
    </div>
  )
}
