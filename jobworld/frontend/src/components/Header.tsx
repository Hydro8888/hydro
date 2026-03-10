'use client'

import Link from 'next/link'
import { useAuthStore } from '@/lib/store'

export default function Header() {
  const { user, logout } = useAuthStore()

  return (
    <header className="bg-white border-b border-[#dadce0]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center text-xl font-medium select-none">
          <span className="text-[#1a73e8] font-bold">Job</span>
          <span className="text-[#ea4335] font-bold">W</span>
          <span className="text-[#fbbc04] font-bold">o</span>
          <span className="text-[#34a853] font-bold">r</span>
          <span className="text-[#1a73e8] font-bold">ld</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/jobs" className="px-3 py-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] rounded transition-colors">
            채용공고
          </Link>
          <Link href="/jobs/post" className="px-3 py-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] rounded transition-colors">
            채용 등록
          </Link>
          {user ? (
            <>
              <Link href="/resume/new" className="px-3 py-1.5 text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] rounded transition-colors">
                이력서
              </Link>
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
        </nav>
      </div>
    </header>
  )
}
