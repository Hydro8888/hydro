'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { jobsAPI, resumesAPI } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

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

interface Resume {
  id: number
  title: string
}

interface SimilarJob {
  id: number
  title: string
  company_name: string
  location: string
  job_type: string
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
  const { user } = useAuthStore()
  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [applied, setApplied] = useState(false)
  const [applying, setApplying] = useState(false)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null)
  const [similarJobs, setSimilarJobs] = useState<SimilarJob[]>([])

  useEffect(() => {
    jobsAPI.get(Number(id)).then(res => {
      setJob(res.data)
      // 비슷한 채용공고 가져오기
      const keyword = res.data.title?.split(' ')[0]
      if (keyword) {
        jobsAPI.list({ limit: 4 }).then(r => {
          setSimilarJobs((r.data.jobs || []).filter((j: SimilarJob) => j.id !== Number(id)).slice(0, 3))
        }).catch(() => {})
      }
    }).catch(() => {}).finally(() => setLoading(false))

    // 로그인 사용자의 이력서 가져오기
    if (user) {
      resumesAPI.list().then(res => {
        const list = res.data.resumes || res.data || []
        setResumes(Array.isArray(list) ? list : [])
        if (Array.isArray(list) && list.length > 0) setSelectedResumeId(list[0].id)
      }).catch(() => {})
    }
  }, [id, user])

  const handleApply = async () => {
    if (!user) {
      alert('로그인 후 지원할 수 있습니다.')
      return
    }
    if (!selectedResumeId) {
      alert('이력서를 먼저 등록해주세요.')
      return
    }
    setApplying(true)
    try {
      await jobsAPI.apply(Number(id), selectedResumeId)
      setApplied(true)
    } catch {
      alert('지원 중 오류가 발생했습니다. 다시 시도해주세요.')
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
          </div>
          {/* 조회수 강조 */}
          <div className="flex items-center gap-1.5 mt-3 text-xs text-[#5f6368]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{job.view_count.toLocaleString()}명이 이 공고를 봤습니다</span>
          </div>
        </div>

        {/* 지원 영역 */}
        <div className="mb-8">
          {!user ? (
            <div className="bg-[#f5f7fa] rounded-xl p-4 text-center">
              <p className="text-sm text-[#5f6368] mb-3">이 공고에 지원하려면 로그인이 필요합니다</p>
              <Link href="/login" className="inline-block px-6 py-2.5 bg-[#1a73e8] text-white text-sm font-medium rounded-lg hover:bg-[#1557b0] transition-colors">
                로그인하고 지원하기
              </Link>
            </div>
          ) : resumes.length === 0 ? (
            <div className="bg-[#f5f7fa] rounded-xl p-4 text-center">
              <p className="text-sm text-[#5f6368] mb-3">지원하려면 이력서를 먼저 등록해주세요</p>
              <Link href="/resume/new" className="inline-block px-6 py-2.5 bg-[#1a73e8] text-white text-sm font-medium rounded-lg hover:bg-[#1557b0] transition-colors">
                이력서 등록하기
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <select
                value={selectedResumeId ?? ''}
                onChange={(e) => setSelectedResumeId(Number(e.target.value))}
                className="flex-1 border border-[#dadce0] rounded-lg px-3 py-2.5 text-sm text-[#202124] bg-white"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
              <button
                onClick={handleApply}
                disabled={applied || applying}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                  applied
                    ? 'bg-[#e6f4ea] text-[#188038] border border-[#a8d5b5]'
                    : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
                } disabled:opacity-50`}
              >
                {applied ? '지원 완료' : applying ? '지원 중...' : '지원하기'}
              </button>
            </div>
          )}
        </div>

        <Section title="업무 내용">{job.description}</Section>
        {job.requirements && <Section title="자격 요건">{job.requirements}</Section>}
        {job.preferred && <Section title="우대 사항">{job.preferred}</Section>}

        <p className="text-xs text-[#80868b] mt-8">
          등록일: {new Date(job.created_at).toLocaleDateString('ko-KR')}
        </p>

        {/* 비슷한 채용공고 */}
        {similarJobs.length > 0 && (
          <div className="mt-10 pt-6 border-t border-[#dadce0]">
            <h2 className="text-sm font-bold text-[#202124] mb-3">다른 채용공고</h2>
            <div className="space-y-2">
              {similarJobs.map((sj) => (
                <Link
                  key={sj.id}
                  href={`/jobs/${sj.id}`}
                  className="block bg-[#f8f9fa] border border-[#dadce0] rounded-lg p-3 hover:border-[#1a73e8] transition-colors"
                >
                  <p className="text-sm font-medium text-[#202124] truncate">{sj.title}</p>
                  <p className="text-xs text-[#5f6368] mt-0.5">{sj.company_name} · {sj.location}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
