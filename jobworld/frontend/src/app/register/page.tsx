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
      <Link href="/" className="text-3xl font-bold mb-8">
        <span className="text-blue-600">Job</span><span className="text-gray-800">World</span>
      </Link>
      <div className="w-full max-w-sm border border-gray-200 rounded-2xl p-8">
        <h1 className="text-lg font-semibold mb-6 text-center">회원가입</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User type toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {[
              { val: 'jobseeker', label: '구직자' },
              { val: 'employer', label: '기업/구인' },
            ].map(({ val, label }) => (
              <button key={val} type="button"
                onClick={() => setForm({ ...form, user_type: val as any })}
                className={`flex-1 py-2 text-sm transition-colors ${
                  form.user_type === val ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                {label}
              </button>
            ))}
          </div>
          <input type="text" required placeholder="이름 / 담당자명" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          <input type="email" required placeholder="이메일" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          <input type="password" required placeholder="비밀번호 (8자 이상)" minLength={8} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? '가입 중...' : '무료 회원가입'}
          </button>
          <p className="text-xs text-gray-400 text-center">
            가입 시 <Link href="/terms" className="underline">이용약관</Link> 및{' '}
            <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의합니다.
          </p>
        </form>
        <div className="text-center mt-4 text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">로그인</Link>
        </div>
      </div>
    </div>
  )
}
