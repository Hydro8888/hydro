'use client'

import Link from 'next/link'
import { useAuthStore } from '@/lib/store'

export default function Header() {
  const { user, logout } = useAuthStore()

  return (
    <header className="border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI </span>
          <span className="text-blue-600">Job</span>
          <span className="text-gray-800">World</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/jobs" className="text-gray-600 hover:text-gray-900">채용공고</Link>
          <Link href="/jobs/post" className="text-gray-600 hover:text-gray-900">채용 등록</Link>
          {user ? (
            <>
              <Link href="/resume/new" className="text-gray-600 hover:text-gray-900">이력서</Link>
              <span className="text-gray-600">{user.name}</span>
              <button onClick={logout} className="text-gray-600 hover:text-gray-900">로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">로그인</Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700">
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
