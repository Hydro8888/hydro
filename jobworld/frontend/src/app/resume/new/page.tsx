'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { resumesAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

const inputCls = 'w-full border border-[#dadce0] rounded px-4 py-2.5 text-sm text-[#202124] placeholder-[#9aa0a6] focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#3c4043] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default function NewResumePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', education: '', experience: '', skills: '', introduction: '', is_public: true,
  })

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setForm({ ...form, [e.target.name]: val })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await resumesAPI.create(form)
      router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || '로그인이 필요합니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-xl font-normal text-[#202124] mb-6">이력서 등록</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="이력서 제목 *">
            <input name="title" required value={form.title} onChange={handleChange}
              placeholder="예: 5년차 백엔드 개발자 이력서" className={inputCls} />
          </Field>
          <Field label="학력">
            <textarea name="education" rows={2} value={form.education} onChange={handleChange}
              placeholder="최종 학력을 입력해주세요" className={inputCls} />
          </Field>
          <Field label="경력">
            <textarea name="experience" rows={4} value={form.experience} onChange={handleChange}
              placeholder="회사명, 직무, 기간 등 경력 사항을 입력해주세요" className={inputCls} />
          </Field>
          <Field label="보유 기술 / 자격증">
            <textarea name="skills" rows={2} value={form.skills} onChange={handleChange}
              placeholder="예: Python, React, AWS, 정보처리기사" className={inputCls} />
          </Field>
          <Field label="자기소개서">
            <textarea name="introduction" rows={5} value={form.introduction} onChange={handleChange}
              placeholder="자유롭게 자기소개를 작성해주세요" className={inputCls} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-[#5f6368] cursor-pointer">
            <input
              type="checkbox"
              name="is_public"
              checked={form.is_public}
              onChange={handleChange}
              className="w-4 h-4 accent-[#1a73e8]"
            />
            이력서를 기업에 공개하기 (AI 인재 추천 포함)
          </label>
          {error && <p className="text-[#d93025] text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a73e8] text-white py-3 rounded text-sm font-medium hover:bg-[#1557b0] disabled:opacity-50 transition-colors"
          >
            {loading ? '등록 중...' : '이력서 등록'}
          </button>
        </form>
      </div>
    </div>
  )
}
