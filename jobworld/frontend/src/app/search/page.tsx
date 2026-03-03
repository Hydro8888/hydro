'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { searchAPI } from '@/lib/api'

interface JobResult {
  id: number
  title: string
  company_name: string
  location: string
  salary_range?: string
  job_type: string
  deadline?: string
  created_at: string
}

interface AISearchResult {
  jobs: JobResult[]
  ai_summary?: string
  total: number
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const [query, setQuery] = useState(q)
  const [results, setResults] = useState<AISearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (q) {
      setQuery(q)
      doSearch(q)
    }
  }, [q])

  const doSearch = async (searchQuery: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await searchAPI.ai(searchQuery)
      setResults(res.data)
    } catch {
      setError('검색 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Search bar */}
      <div className="border-b border-gray-100 py-4 px-4">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
          <div className="flex-1 flex items-center border border-gray-300 rounded-full px-4 py-2 focus-within:border-blue-400">
            <svg className="w-4 h-4 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 outline-none text-sm text-gray-800"
            />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm hover:bg-blue-700">
            검색
          </button>
        </form>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">AI가 검색 중...</p>
          </div>
        )}

        {error && <p className="text-red-500 text-sm text-center py-8">{error}</p>}

        {results && !loading && (
          <>
            {/* AI Summary */}
            {results.ai_summary && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-gray-700">
                <div className="flex items-center gap-1.5 text-blue-600 font-medium mb-1.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm-1-5h2v2H9v-2zm0-6h2v4H9V5z" />
                  </svg>
                  AI 요약
                </div>
                <p>{results.ai_summary}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 mb-4">{results.total}개의 결과</p>

            {results.jobs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>검색 결과가 없습니다.</p>
                <Link href="/jobs" className="text-blue-600 text-sm mt-2 block hover:underline">전체 채용공고 보기</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {results.jobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}
                    className="block border border-gray-100 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{job.company_name}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">{job.job_type}</span>
                    </div>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>{job.location}</span>
                      {job.salary_range && <span>{job.salary_range}</span>}
                      {job.deadline && <span>~{job.deadline}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>}>
      <SearchContent />
    </Suspense>
  )
}
