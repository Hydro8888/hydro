'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { jobsAPI } from '@/lib/api'

export default function PostJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', location: '',
    salary_range: '', job_type: '정규직',
    deadline: '', requirements: '', preferred: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await jobsAPI.create(form)
      router.push(`/jobs/${res.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || '등록 중 오류가 발생했습니다. 로그인이 필요합니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-lg font-semibold mb-6">채용공고 등록</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="공고 제목 *">
            <input name="title" required value={form.title} onChange={handleChange}
              placeholder="예: 프론트엔드 개발자 (React)" className={inputCls} />
          </Field>
          <Field label="근무지 *">
            <input name="location" required value={form.location} onChange={handleChange}
              placeholder="예: 서울 강남구 / 재택 가능" className={inputCls} />
          </Field>
          <Field label="고용 형태 *">
            <select name="job_type" value={form.job_type} onChange={handleChange} className={inputCls}>
              {['정규직', '계약직', '파트타임', '인턴', '프리랜서'].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="급여">
            <input name="salary_range" value={form.salary_range} onChange={handleChange}
              placeholder="예: 월 300~500만원 / 협의 가능" className={inputCls} />
          </Field>
          <Field label="마감일">
            <input type="date" name="deadline" value={form.deadline} onChange={handleChange} className={inputCls} />
          </Field>
          <Field label="상세 내용 *">
            <textarea name="description" required rows={5} value={form.description} onChange={handleChange}
              placeholder="업무 내용, 근무 환경, 복리후생 등을 자유롭게 작성해주세요" className={inputCls} />
          </Field>
          <Field label="자격 요건">
            <textarea name="requirements" rows={3} value={form.requirements} onChange={handleChange}
              placeholder="필수 자격 요건을 입력해주세요" className={inputCls} />
          </Field>
          <Field label="우대 사항">
            <textarea name="preferred" rows={3} value={form.preferred} onChange={handleChange}
              placeholder="우대 사항을 입력해주세요" className={inputCls} />
          </Field>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? '등록 중...' : '무료로 채용공고 등록'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
