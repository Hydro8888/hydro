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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-medium text-[#3c4043] mb-2 pb-1 border-b border-[#f1f3f4]">{title}</h2>
      <p className="text-sm text-[#5f6368] whitespace-pre-wrap leading-relaxed">{children}</p>
    </div>
  )
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
        <div className="animate-spin w-8 h-8 border-2 border-[#1a73e8] border-t-transparent rounded-full" />
      </div>
    </div>
  )

  if (!job) return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-[#80868b] text-sm">
        채용공고를 찾을 수 없습니다.
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="pb-6 mb-6 border-b border-[#dadce0]">
          <span className="text-xs text-[#5f6368] bg-[#f8f9fa] border border-[#dadce0] px-2 py-0.5 rounded-full">{job.job_type}</span>
          <h1 className="text-2xl font-normal text-[#202124] mt-3 mb-1">{job.title}</h1>
          <p className="text-[#5f6368] font-medium">{job.company_name}</p>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-[#80868b]">
            <span>{job.location}</span>
            {job.salary_range && <span>{job.salary_range}</span>}
            {job.deadline && <span>마감 {job.deadline}</span>}
            <span>조회 {job.view_count.toLocaleString()}</span>
          </div>
        </div>

        {/* 지원 버튼 */}
        <button
          onClick={handleApply}
          disabled={applied || applying}
          className={`w-full py-3 rounded text-sm font-medium mb-8 transition-colors ${
            applied
              ? 'bg-[#e6f4ea] text-[#188038] border border-[#a8d5b5]'
              : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
          } disabled:opacity-50`}
        >
          {applied ? '지원 완료' : applying ? '지원 중...' : '원클릭 지원'}
        </button>

        <Section title="업무 내용">{job.description}</Section>
        {job.requirements && <Section title="자격 요건">{job.requirements}</Section>}
        {job.preferred && <Section title="우대 사항">{job.preferred}</Section>}

        <p className="text-xs text-[#80868b] mt-8">
          등록일: {new Date(job.created_at).toLocaleDateString('ko-KR')}
        </p>
      </div>
    </div>
  )
}
