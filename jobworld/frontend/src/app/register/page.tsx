'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({
    email: '', password: '', name: '', user_type: 'jobseeker' as 'jobseeker' | 'employer',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authAPI.register(form)
      setAuth(res.data.user, res.data.access_token)
      router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || '회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <Link href="/" className="flex items-center text-4xl font-medium select-none mb-8">
        <span className="text-[#4285f4]">J</span>
        <span className="text-[#ea4335]">o</span>
        <span className="text-[#fbbc04]">b</span>
        <span className="text-[#4285f4]">W</span>
        <span className="text-[#34a853]">o</span>
        <span className="text-[#ea4335]">r</span>
        <span className="text-[#4285f4]">l</span>
        <span className="text-[#fbbc04]">d</span>
      </Link>

      <div className="w-full max-w-sm border border-[#dadce0] rounded-lg p-8">
        <h1 className="text-2xl font-normal text-[#202124] mb-2">계정 만들기</h1>
        <p className="text-sm text-[#5f6368] mb-6">무료로 시작하세요</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 회원 유형 */}
          <div className="flex rounded border border-[#dadce0] overflow-hidden">
            {[
              { val: 'jobseeker', label: '구직자' },
              { val: 'employer', label: '기업/구인' },
            ].map(({ val, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => setForm({ ...form, user_type: val as any })}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  form.user_type === val
                    ? 'bg-[#1a73e8] text-white'
                    : 'text-[#5f6368] hover:bg-[#f8f9fa]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="text"
            required
            placeholder="이름 / 담당자명"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-[#dadce0] rounded px-4 py-3 text-sm text-[#202124] placeholder-[#9aa0a6] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-colors"
          />
          <input
            type="email"
            required
            placeholder="이메일"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-[#dadce0] rounded px-4 py-3 text-sm text-[#202124] placeholder-[#9aa0a6] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-colors"
          />
          <input
            type="password"
            required
            placeholder="비밀번호 (8자 이상)"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-[#dadce0] rounded px-4 py-3 text-sm text-[#202124] placeholder-[#9aa0a6] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-colors"
          />
          {error && <p className="text-[#d93025] text-xs">{error}</p>}

          <p className="text-xs text-[#80868b]">
            가입 시{' '}
            <Link href="/terms" className="text-[#1a73e8] hover:underline">이용약관</Link>
            {' '}및{' '}
            <Link href="/privacy" className="text-[#1a73e8] hover:underline">개인정보처리방침</Link>
            에 동의합니다.
          </p>

          <div className="flex items-center justify-between pt-2">
            <Link href="/login" className="text-sm text-[#1a73e8] hover:text-[#1557b0]">
              이미 계정이 있으신가요?
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#1a73e8] text-white text-sm font-medium rounded hover:bg-[#1557b0] disabled:opacity-50 transition-colors"
            >
              {loading ? '가입 중...' : '다음'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
