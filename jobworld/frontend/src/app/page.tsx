'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const quickLinks = [
    { label: '개발자', q: '개발자' },
    { label: '디자이너', q: '디자이너' },
    { label: '재택근무', q: '재택근무' },
    { label: '신입 가능', q: '신입 가능' },
    { label: '주 3일', q: '주 3일 근무' },
    { label: '마케팅', q: '마케팅' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <nav className="flex justify-end items-center px-6 py-3 gap-4 text-sm">
        <Link href="/jobs/post" className="text-gray-600 hover:text-gray-900">채용 등록</Link>
        <Link href="/resume/new" className="text-gray-600 hover:text-gray-900">이력서 등록</Link>
        <Link href="/login" className="text-gray-600 hover:text-gray-900">로그인</Link>
        <Link href="/register" className="bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 text-sm">회원가입</Link>
      </nav>

      {/* Main content - centered like Google */}
      <main className="flex-1 flex flex-col items-center justify-center px-4" style={{ marginTop: '-80px' }}>
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI </span>
            <span className="text-blue-600">Job</span>
            <span className="text-gray-800">World</span>
          </h1>
          <p className="mt-3 text-gray-700 text-lg font-medium">AI가 찾아주는 나만의 맞춤 일자리</p>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-0.5 rounded-full text-xs font-semibold">
              ✓ 누구나 완전 무료
            </span>
            구인·구직 등록부터 검색까지 무료
          </p>
        </div>

        {/* Search box */}
        <form onSubmit={handleSearch} className="w-full max-w-xl">
          <div className="flex items-center border border-gray-300 rounded-full px-5 py-3 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-blue-400 transition-all">
            <svg className="w-5 h-5 text-gray-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="직무, 회사, 키워드로 AI 검색..."
              className="flex-1 outline-none text-gray-800 placeholder-gray-400 text-base bg-transparent"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 mr-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <button type="submit" className="bg-blue-600 text-white px-5 py-1.5 rounded-full text-sm hover:bg-blue-700 shrink-0">
              검색
            </button>
          </div>
        </form>

        {/* Quick search tags */}
        <div className="flex flex-wrap gap-2 mt-5 justify-center max-w-xl">
          {quickLinks.map((link) => (
            <button
              key={link.q}
              onClick={() => router.push(`/search?q=${encodeURIComponent(link.q)}`)}
              className="text-sm text-gray-600 border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-7">
          <Link href="/jobs" className="text-sm text-gray-600 border border-gray-200 rounded-full px-5 py-2 hover:bg-gray-50 transition-colors">
            채용공고 보기
          </Link>
          <Link href="/jobs/post" className="text-sm text-white bg-blue-600 rounded-full px-5 py-2 hover:bg-blue-700 transition-colors">
            채용공고 등록 (무료)
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 py-5 space-y-1">
        <div className="flex justify-center gap-4">
          <Link href="/about" className="hover:text-gray-600">서비스 소개</Link>
          <Link href="/privacy" className="hover:text-gray-600">개인정보처리방침</Link>
          <Link href="/terms" className="hover:text-gray-600">이용약관</Link>
          <Link href="/admin" className="hover:text-gray-600">관리자</Link>
        </div>
        <p>© 2026 AI JobWorld. 모든 서비스 무료 제공.</p>
      </footer>
    </div>
  )
}
