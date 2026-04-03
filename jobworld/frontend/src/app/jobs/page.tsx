'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { jobsAPI } from '@/lib/api'

interface Job {
  id: number
  title: string
  company_name: string
  location: string
  salary_range?: string
  job_type: string
  deadline?: string
  created_at: string
}

const JOB_TYPES = ['전체', '정규직', '계약직', '파트타임', '인턴', '프리랜서']

function JobsContent() {
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [jobType, setJobType] = useState('전체')
  const [location, setLocation] = useState('')

  useEffect(() => {
    fetchJobs()
  }, [jobType, location])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (jobType !== '전체') params.job_type = jobType
      if (location) params.location = location
      const res = await jobsAPI.list(params)
      setJobs(res.data.jobs || [])
      setTotal(res.data.total || 0)
    } catch {
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-[#1c1c1c]">
            채용공고
            <span className="ml-2 text-sm text-[#9b9b9b] font-normal">{total.toLocaleString()}개</span>
          </h1>
          <Link
            href="/jobs/post"
            className="px-4 py-2 bg-[#1a73e8] text-white text-sm font-medium rounded-xl hover:bg-[#1557b0] transition-colors"
          >
            채용 등록
          </Link>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {JOB_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setJobType(type)}
              className={`text-sm px-4 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                jobType === type
                  ? 'bg-[#1a73e8] text-white border-[#1a73e8]'
                  : 'text-[#5f6368] border-[#dfe3e8] bg-white hover:border-[#1a73e8]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* 지역 검색 */}
        <input
          type="text"
          placeholder="지역 필터 (예: 서울, 판교...)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full border border-[#dfe3e8] rounded-xl px-4 py-2.5 text-sm text-[#1c1c1c] placeholder-[#9b9b9b] bg-white mb-6 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]/30 transition-colors"
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-7 h-7 border-2 border-[#1a73e8] border-t-transparent rounded-full" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-[#9b9b9b]">
            <p className="mb-2 text-sm">등록된 채용공고가 없습니다.</p>
            <Link href="/jobs/post" className="text-[#1a73e8] text-sm hover:underline">
              첫 번째 채용공고를 등록해보세요
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white border border-[#dfe3e8] rounded-xl p-4 hover:border-[#1a73e8] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-[#1c1c1c]">{job.title}</h3>
                    <p className="text-sm text-[#5f6368] mt-0.5">{job.company_name}</p>
                  </div>
                  <span className="text-xs bg-[#eef1f6] text-[#5f6368] px-2.5 py-0.5 rounded-full border border-[#dfe3e8] shrink-0 ml-3">
                    {job.job_type}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#9b9b9b]">
                  <span>{job.location}</span>
                  {job.salary_range && <span>{job.salary_range}</span>}
                  {job.deadline && <span>마감 {job.deadline}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#f5f7fa]">
        <div className="animate-spin w-7 h-7 border-2 border-[#1a73e8] border-t-transparent rounded-full" />
      </div>
    }>
      <JobsContent />
    </Suspense>
  )
}
