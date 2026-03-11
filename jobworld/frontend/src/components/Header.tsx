'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'

export default function Header() {
  const { user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-[#dadce0]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center text-xl font-medium select-none shrink-0">
          <span className="text-[#1a73e8] font-bold">Job</span>
          <span className="text-[#ea4335] font-bold">W</span>
          <span className="text-[#fbbc04] font-bold">o</span>
          <span className="text-[#34a853] font-bold">r</span>
          <span className="text-[#1a73e8] font-bold">ld</span>
        </Link>

        {/* 데스크탑 nav */}
        <nav className="hidden sm:flex items-center gap-1 text-sm">
          <Link href="/jobs" className="px-3 py-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] rounded transition-colors">
            채용공고
          </Link>
          <Link href="/jobs/post" className="px-3 py-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] rounded transition-colors">
            채용 등록
          </Link>
          {user ? (
            <>
              <Link href="/resume/new" className="px-3 py-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] rounded transition-colors">
                이력서 등록
              </Link>
              <span className="px-3 py-1.5 text-[#5f6368] max-w-[100px] truncate">{user.name}</span>
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
        </nav>

        {/* 모바일: 로그인 표시 + 햄버거 */}
        <div className="flex sm:hidden items-center gap-2">
          {user ? (
            <span className="text-sm text-[#5f6368] max-w-[80px] truncate">{user.name}</span>
          ) : (
            <Link href="/login" className="text-sm text-[#1a73e8] font-medium px-2 py-1">
              로그인
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-[#5f6368] hover:bg-[#f8f9fa] rounded transition-colors"
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

      {/* 모바일 드롭다운 메뉴 */}
      {menuOpen && (
        <div className="sm:hidden border-t border-[#dadce0] bg-white">
          <nav className="flex flex-col py-1">
            <Link
              href="/jobs"
              onClick={() => setMenuOpen(false)}
              className="px-6 py-3 text-sm text-[#202124] hover:bg-[#f8f9fa] transition-colors"
            >
              채용공고
            </Link>
            <Link
              href="/jobs/post"
              onClick={() => setMenuOpen(false)}
              className="px-6 py-3 text-sm text-[#202124] hover:bg-[#f8f9fa] transition-colors"
            >
              채용 등록
            </Link>
            <Link
              href="/resume/new"
              onClick={() => setMenuOpen(false)}
              className="px-6 py-3 text-sm text-[#202124] hover:bg-[#f8f9fa] transition-colors"
            >
              이력서 등록
            </Link>
            {user ? (
              <button
                onClick={() => { logout(); setMenuOpen(false) }}
                className="px-6 py-3 text-sm text-left text-[#d93025] hover:bg-[#f8f9fa] transition-colors"
              >
                로그아웃
              </button>
            ) : (
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="mx-4 my-2 px-4 py-2.5 bg-[#1a73e8] text-white text-sm font-medium rounded text-center hover:bg-[#1557b0] transition-colors block"
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
