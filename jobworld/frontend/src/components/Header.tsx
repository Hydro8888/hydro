'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'

export default function Header() {
  const { user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-[#f5f7fa] border-b border-[#dfe3e8]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-1.5 select-none shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#1a73e8]" />
          <span className="text-lg font-bold text-[#1c1c1c] tracking-tight">JobWorld</span>
        </Link>

        {/* 데스크탑 nav — 중앙 (역할별) */}
        <nav className="hidden sm:flex items-center gap-1 text-sm absolute left-1/2 -translate-x-1/2">
          {user?.user_type === 'employer' ? (
            <>
              <Link href="/search?q=개발자&type=구직" className="px-3 py-1.5 text-[#5f6368] hover:text-[#1c1c1c] transition-colors rounded">인재 검색</Link>
              <Link href="/jobs" className="px-3 py-1.5 text-[#5f6368] hover:text-[#1c1c1c] transition-colors rounded">채용 관리</Link>
              <Link href="/jobs/post" className="px-3 py-1.5 text-[#5f6368] hover:text-[#1c1c1c] transition-colors rounded">채용 등록</Link>
            </>
          ) : user?.user_type === 'admin' ? (
            <>
              <Link href="/jobs" className="px-3 py-1.5 text-[#5f6368] hover:text-[#1c1c1c] transition-colors rounded">채용공고</Link>
              <Link href="/search?q=개발자&type=구인" className="px-3 py-1.5 text-[#5f6368] hover:text-[#1c1c1c] transition-colors rounded">AI 검색</Link>
              <Link href="/admin" className="px-3 py-1.5 text-[#5f6368] hover:text-[#1c1c1c] transition-colors rounded">관리자</Link>
            </>
          ) : (
            <>
              <Link href="/jobs" className="px-3 py-1.5 text-[#5f6368] hover:text-[#1c1c1c] transition-colors rounded">채용공고</Link>
              <Link href="/search?q=개발자&type=구인" className="px-3 py-1.5 text-[#5f6368] hover:text-[#1c1c1c] transition-colors rounded">AI 검색</Link>
              <Link href="/jobs/post" className="px-3 py-1.5 text-[#5f6368] hover:text-[#1c1c1c] transition-colors rounded">채용 등록</Link>
              <Link href="/resume/new" className="px-3 py-1.5 text-[#5f6368] hover:text-[#1c1c1c] transition-colors rounded">이력서 등록</Link>
            </>
          )}
        </nav>

        {/* 우측 액션 */}
        <div className="hidden sm:flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-[#5f6368] max-w-[100px] truncate">{user.name}</span>
              <button
                onClick={logout}
                className="px-4 py-1.5 text-sm text-[#1c1c1c] border border-[#dfe3e8] rounded-full hover:border-[#1a73e8] transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 text-sm text-[#5f6368] hover:text-[#1c1c1c] transition-colors">
                로그인
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 text-sm font-medium text-[#1a73e8] border border-[#1a73e8] rounded-full hover:bg-[#1a73e8] hover:text-white transition-colors"
              >
                회원가입
              </Link>
            </>
          )}
        </div>

        {/* 모바일: 로그인 + 햄버거 */}
        <div className="flex sm:hidden items-center gap-2">
          {user ? (
            <span className="text-sm text-[#5f6368] max-w-[80px] truncate">{user.name}</span>
          ) : (
            <Link href="/login" className="text-sm text-[#1c1c1c] font-medium px-2 py-1">
              로그인
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-[#5f6368] hover:text-[#1c1c1c] transition-colors"
            aria-label="메뉴 열기"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 모바일 드롭다운 */}
      {menuOpen && (
        <div className="sm:hidden border-t border-[#dfe3e8] bg-[#f5f7fa]">
          <nav className="flex flex-col py-1">
            <Link href="/jobs" onClick={() => setMenuOpen(false)} className="px-6 py-3 text-sm text-[#1c1c1c] hover:bg-[#eef1f6] transition-colors">채용공고</Link>
            <Link href="/search?q=개발자&type=구인" onClick={() => setMenuOpen(false)} className="px-6 py-3 text-sm text-[#1c1c1c] hover:bg-[#eef1f6] transition-colors">AI 검색</Link>
            <Link href="/jobs/post" onClick={() => setMenuOpen(false)} className="px-6 py-3 text-sm text-[#1c1c1c] hover:bg-[#eef1f6] transition-colors">채용 등록</Link>
            <Link href="/resume/new" onClick={() => setMenuOpen(false)} className="px-6 py-3 text-sm text-[#1c1c1c] hover:bg-[#eef1f6] transition-colors">이력서 등록</Link>
            {user ? (
              <button
                onClick={() => { logout(); setMenuOpen(false) }}
                className="px-6 py-3 text-sm text-left text-[#d93025] hover:bg-[#eef1f6] transition-colors"
              >
                로그아웃
              </button>
            ) : (
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="mx-4 my-2 px-4 py-2.5 border border-[#1a73e8] text-[#1a73e8] text-sm font-medium rounded-full text-center hover:bg-[#1a73e8] hover:text-white transition-colors block"
              >
                회원가입
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
