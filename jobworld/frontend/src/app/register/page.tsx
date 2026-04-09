'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const typeParam = searchParams.get('type')
  const [form, setForm] = useState({
    email: '', password: '', name: '',
    user_type: (typeParam === 'employer' ? 'employer' : 'jobseeker') as 'jobseeker' | 'employer',
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

  const benefits = {
    jobseeker: [
      'AI 맞춤 채용 추천',
      '워크넷 7,000+ 공공채용 검색',
      '원클릭 입사 지원',
      '모든 기능 완전 무료',
    ],
    employer: [
      '무료 채용공고 등록 (무제한)',
      'AI 인재 매칭 검색',
      '지원자 관리 대시보드',
      '모든 기능 완전 무료',
    ],
  }

  return (
    <div className="min-h-screen flex flex-col sm:flex-row items-center justify-center bg-[#f5f7fa] px-4 gap-8">
      {/* 혜택 사이드바 */}
      <div className="hidden sm:block w-full max-w-xs">
        <Link href="/" className="flex items-center gap-1.5 select-none mb-6">
          <span className="w-2 h-2 rounded-full bg-[#1a73e8]" />
          <span className="text-xl font-bold text-[#1c1c1c] tracking-tight">JobWorld</span>
        </Link>
        <h2 className="text-2xl font-bold text-[#1c1c1c] mb-2">
          {form.user_type === 'jobseeker' ? '나에게 딱 맞는\n일자리를 찾으세요' : '우수 인재를\nAI로 빠르게 찾으세요'}
        </h2>
        <p className="text-sm text-[#5f6368] mb-6">가입 즉시 모든 기능을 무료로 이용할 수 있습니다.</p>
        <ul className="space-y-3">
          {benefits[form.user_type].map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-[#5f6368]">
              <svg className="w-4 h-4 text-[#1a73e8] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* 폼 영역 */}
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-1.5 select-none mb-8 sm:hidden justify-center">
          <span className="w-2 h-2 rounded-full bg-[#1a73e8]" />
          <span className="text-xl font-bold text-[#1c1c1c] tracking-tight">JobWorld</span>
        </Link>

        <div className="bg-white border border-[#dfe3e8] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-[#1c1c1c] mb-1">계정 만들기</h1>
          <p className="text-sm text-[#5f6368] mb-6">무료로 시작하세요</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 회원 유형 */}
            <div className="flex rounded-xl border border-[#dfe3e8] overflow-hidden">
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
                      : 'text-[#5f6368] hover:bg-[#eef1f6]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              placeholder={form.user_type === 'employer' ? '회사명 / 담당자명' : '이름'}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-[#dfe3e8] rounded-xl px-4 py-3 text-sm text-[#1c1c1c] placeholder-[#9b9b9b] bg-[#f8f9fc] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]/30 transition-colors"
            />
            <input
              type="email"
              required
              placeholder="이메일"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-[#dfe3e8] rounded-xl px-4 py-3 text-sm text-[#1c1c1c] placeholder-[#9b9b9b] bg-[#f8f9fc] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]/30 transition-colors"
            />
            <input
              type="password"
              required
              placeholder="비밀번호 (8자 이상)"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-[#dfe3e8] rounded-xl px-4 py-3 text-sm text-[#1c1c1c] placeholder-[#9b9b9b] bg-[#f8f9fc] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]/30 transition-colors"
            />
            {error && <p className="text-[#d93025] text-xs">{error}</p>}

            <p className="text-xs text-[#9b9b9b]">
              가입 시{' '}
              <Link href="/terms" className="text-[#1a73e8] hover:underline">이용약관</Link>
              {' '}및{' '}
              <Link href="/privacy" className="text-[#1a73e8] hover:underline">개인정보처리방침</Link>
              에 동의합니다.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1a73e8] text-white text-sm font-medium rounded-xl hover:bg-[#1557b0] disabled:opacity-50 transition-colors"
            >
              {loading ? '가입 중...' : '무료로 시작하기'}
            </button>

            <p className="text-center text-sm text-[#5f6368]">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-[#1a73e8] hover:underline font-medium">로그인</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#f5f7fa]">
        <div className="animate-spin w-7 h-7 border-2 border-[#1a73e8] border-t-transparent rounded-full" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
