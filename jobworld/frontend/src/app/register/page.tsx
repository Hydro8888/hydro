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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f2f0eb] px-4">
      <Link href="/" className="flex items-center gap-1.5 select-none mb-8">
        <span className="w-2 h-2 rounded-full bg-[#e8623a]" />
        <span className="text-xl font-bold text-[#1c1c1c] tracking-tight">JobWorld</span>
      </Link>

      <div className="w-full max-w-sm bg-white border border-[#ddd9d0] rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-[#1c1c1c] mb-1">계정 만들기</h1>
        <p className="text-sm text-[#6b6b6b] mb-6">무료로 시작하세요</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 회원 유형 */}
          <div className="flex rounded-xl border border-[#ddd9d0] overflow-hidden">
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
                    ? 'bg-[#1c1c1c] text-white'
                    : 'text-[#6b6b6b] hover:bg-[#f5f3ee]'
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
            className="w-full border border-[#ddd9d0] rounded-xl px-4 py-3 text-sm text-[#1c1c1c] placeholder-[#9b9b9b] bg-[#f9f8f5] focus:outline-none focus:border-[#e8623a] focus:ring-1 focus:ring-[#e8623a] transition-colors"
          />
          <input
            type="email"
            required
            placeholder="이메일"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-[#ddd9d0] rounded-xl px-4 py-3 text-sm text-[#1c1c1c] placeholder-[#9b9b9b] bg-[#f9f8f5] focus:outline-none focus:border-[#e8623a] focus:ring-1 focus:ring-[#e8623a] transition-colors"
          />
          <input
            type="password"
            required
            placeholder="비밀번호 (8자 이상)"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-[#ddd9d0] rounded-xl px-4 py-3 text-sm text-[#1c1c1c] placeholder-[#9b9b9b] bg-[#f9f8f5] focus:outline-none focus:border-[#e8623a] focus:ring-1 focus:ring-[#e8623a] transition-colors"
          />
          {error && <p className="text-[#e8623a] text-xs">{error}</p>}

          <p className="text-xs text-[#9b9b9b]">
            가입 시{' '}
            <Link href="/terms" className="text-[#e8623a] hover:underline">이용약관</Link>
            {' '}및{' '}
            <Link href="/privacy" className="text-[#e8623a] hover:underline">개인정보처리방침</Link>
            에 동의합니다.
          </p>

          <div className="flex items-center justify-between pt-2">
            <Link href="/login" className="text-sm text-[#e8623a] hover:underline">
              이미 계정이 있으신가요?
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#1c1c1c] text-white text-sm font-medium rounded-xl hover:bg-[#333] disabled:opacity-50 transition-colors"
            >
              {loading ? '가입 중...' : '가입하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
