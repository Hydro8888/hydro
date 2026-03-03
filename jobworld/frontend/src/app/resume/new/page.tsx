'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { resumesAPI } from '@/lib/api'

export default function NewResumePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', education: '', experience: '', skills: '', introduction: '', is_public: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setForm({ ...form, [e.target.name]: val })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await resumesAPI.create(form)
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
        <h1 className="text-lg font-semibold mb-6">이력서 등록</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="이력서 제목 *">
            <input name="title" required value={form.title} onChange={handleChange}
              placeholder="예: 5년차 백엔드 개발자 이력서" className={cls} />
          </Field>
          <Field label="학력">
            <textarea name="education" rows={2} value={form.education} onChange={handleChange}
              placeholder="최종 학력을 입력해주세요" className={cls} />
          </Field>
          <Field label="경력">
            <textarea name="experience" rows={4} value={form.experience} onChange={handleChange}
              placeholder="회사명, 직무, 기간 등 경력 사항을 입력해주세요" className={cls} />
          </Field>
          <Field label="보유 기술/자격증">
            <textarea name="skills" rows={2} value={form.skills} onChange={handleChange}
              placeholder="예: Python, React, AWS, 정보처리기사" className={cls} />
          </Field>
          <Field label="자기소개서">
            <textarea name="introduction" rows={5} value={form.introduction} onChange={handleChange}
              placeholder="자유롭게 자기소개를 작성해주세요" className={cls} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" name="is_public" checked={form.is_public} onChange={handleChange}
              className="rounded" />
            이력서를 기업에 공개하기 (AI 인재 추천 포함)
          </label>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? '등록 중...' : '이력서 등록'}
          </button>
        </form>
      </div>
    </div>
  )
}

const cls = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
