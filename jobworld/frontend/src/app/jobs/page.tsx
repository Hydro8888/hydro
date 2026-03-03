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
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-gray-900">채용공고 <span className="text-gray-400 text-sm font-normal">{total}개</span></h1>
          <Link href="/jobs/post" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700">
            채용 등록
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {JOB_TYPES.map((type) => (
            <button key={type} onClick={() => setJobType(type)}
              className={`text-sm px-4 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                jobType === type ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              {type}
            </button>
          ))}
        </div>

        {/* Location filter */}
        <input type="text" placeholder="지역 필터 (예: 서울, 판교...)"
          value={location} onChange={(e) => setLocation(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm mb-5 focus:outline-none focus:border-blue-400" />

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="mb-2">등록된 채용공고가 없습니다.</p>
            <Link href="/jobs/post" className="text-blue-600 text-sm hover:underline">첫 번째 채용공고를 등록해보세요</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}
                className="block border border-gray-100 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{job.company_name}</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0 ml-2">{job.job_type}</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>}>
      <JobsContent />
    </Suspense>
  )
}
