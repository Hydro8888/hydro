'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/Header'
import { jobsAPI } from '@/lib/api'

interface JobDetail {
  id: number
  title: string
  company_name: string
  location: string
  salary_range?: string
  job_type: string
  deadline?: string
  description: string
  requirements?: string
  preferred?: string
  created_at: string
  view_count: number
}

export default function JobDetailPage() {
  const { id } = useParams()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [applied, setApplied] = useState(false)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    jobsAPI.get(Number(id)).then(res => setJob(res.data)).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const handleApply = async () => {
    setApplying(true)
    try {
      await jobsAPI.apply(Number(id), 1)
      setApplied(true)
    } catch {
      alert('지원하려면 로그인 후 이력서를 먼저 등록해주세요.')
    } finally {
      setApplying(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    </div>
  )

  if (!job) return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-400">
        채용공고를 찾을 수 없습니다.
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Job header */}
        <div className="border-b border-gray-100 pb-6 mb-6">
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{job.job_type}</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">{job.title}</h1>
          <p className="text-gray-600 font-medium">{job.company_name}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
            <span>{job.location}</span>
            {job.salary_range && <span>{job.salary_range}</span>}
            {job.deadline && <span>마감 {job.deadline}</span>}
            <span>조회 {job.view_count}</span>
          </div>
        </div>

        {/* Apply button */}
        <button onClick={handleApply} disabled={applied || applying}
          className={`w-full py-3 rounded-full font-medium mb-8 transition-colors ${
            applied ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50`}>
          {applied ? '지원 완료!' : applying ? '지원 중...' : '원클릭 지원'}
        </button>

        {/* Content sections */}
        <Section title="업무 내용">{job.description}</Section>
        {job.requirements && <Section title="자격 요건">{job.requirements}</Section>}
        {job.preferred && <Section title="우대 사항">{job.preferred}</Section>}

        <p className="text-xs text-gray-400 mt-8">등록일: {new Date(job.created_at).toLocaleDateString('ko-KR')}</p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{children}</p>
    </div>
  )
}
