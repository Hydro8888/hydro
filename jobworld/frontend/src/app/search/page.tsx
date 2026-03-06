'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { searchAPI, AISearchResult, JobDbResult, ResumeDbResult } from '@/lib/api'

const GEMINI_MODEL_LABEL = 'gemini-3.1-flash-lite-preview'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const typeParam = searchParams.get('type') as '구인' | '구직' | null

  const [query, setQuery] = useState(q)
  const [searchType, setSearchType] = useState<'구인' | '구직'>(typeParam === '구직' ? '구직' : '구인')
  const [results, setResults] = useState<AISearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (q) {
      setQuery(q)
      const t = typeParam === '구직' ? '구직' : '구인'
      setSearchType(t)
      doSearch(q, t)
    }
  }, [q, typeParam])

  const doSearch = async (searchQuery: string, type: '구인' | '구직') => {
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const res = await searchAPI.ai(searchQuery, type)
      setResults(res.data)
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || '검색 중 오류가 발생했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${encodeURIComponent(searchType)}`)
    }
  }

  const isJobResult = (r: JobDbResult | ResumeDbResult): r is JobDbResult => r.type === '구인'

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ── 검색 바 ── */}
      <div className="border-b border-gray-100 py-4 px-4">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto space-y-2">
          <div className="flex gap-2 mb-1">
            {(['구인', '구직'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSearchType(type)}
                className={`px-4 py-1 rounded-full text-xs font-semibold transition-all border ${
                  searchType === type
                    ? type === '구인'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-purple-600 text-white border-purple-600'
                    : 'text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {type === '구인' ? '🏢 구인' : '👤 구직'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className={`flex-1 flex items-center border-2 rounded-full px-4 py-2 focus-within:ring-1 ${
              searchType === '구인'
                ? 'border-blue-300 focus-within:border-blue-500 focus-within:ring-blue-100'
                : 'border-purple-300 focus-within:border-purple-500 focus-within:ring-purple-100'
            }`}>
              <svg className="w-4 h-4 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchType === '구인' ? '직무, 기술, 지역, 연봉으로 검색...' : '기술스택, 경력, 직종으로 구직자 검색...'}
                className="flex-1 outline-none text-sm text-gray-800 bg-transparent"
              />
            </div>
            <button
              type="submit"
              className={`text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                searchType === '구인' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              AI 검색
            </button>
          </div>
        </form>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 로딩 */}
        {loading && (
          <div className="text-center py-16 text-gray-400">
            <div className={`animate-spin w-9 h-9 border-2 border-t-transparent rounded-full mx-auto mb-3 ${
              searchType === '구인' ? 'border-blue-600' : 'border-purple-600'
            }`} />
            <p className="text-sm font-medium">Gemini AI가 분석 중...</p>
            <p className="text-xs mt-1 text-gray-400">
              {searchType === '구인' ? '채용공고를 검색하고 있습니다' : '구직자 이력서를 검색하고 있습니다'}
            </p>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="text-center py-10 bg-red-50 rounded-xl border border-red-100">
            <p className="text-red-500 text-sm font-medium">⚠️ {error}</p>
            <button
              type="button"
              onClick={() => doSearch(q, searchType)}
              className="mt-3 text-xs text-red-400 underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {results && !loading && (
          <div className="space-y-8">
            {/* ── 검색 뱃지 + 추천 필터 ── */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                results.search_type === '구인'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {results.search_type === '구인' ? '🏢 구인 검색' : '👤 구직 검색'}
              </span>
              <span className="text-xs text-gray-400">"{results.query}"</span>
              {results.ai_recommended_filters && results.ai_recommended_filters.length > 0 &&
                results.ai_recommended_filters.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => router.push(`/search?q=${encodeURIComponent(f)}&type=${encodeURIComponent(searchType)}`)}
                    className="text-xs border border-gray-200 text-gray-500 px-2.5 py-0.5 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {f}
                  </button>
                ))
              }
            </div>

            {/* ── SECTION 1: 플랫폼 등록 결과 (우선 표시) ── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-gray-800">
                  {results.search_type === '구인' ? '📋 등록된 채용공고' : '📄 등록된 구직자'}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {results.db_total}건
                </span>
              </div>

              {results.db_results.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl text-gray-400 text-sm">
                  <p>등록된 {results.search_type === '구인' ? '채용공고' : '이력서'}가 없습니다.</p>
                  {results.search_type === '구인' ? (
                    <Link href="/jobs/post" className="text-blue-600 mt-1 block hover:underline text-xs">
                      채용공고 등록하기 (무료)
                    </Link>
                  ) : (
                    <Link href="/resume/new" className="text-purple-600 mt-1 block hover:underline text-xs">
                      이력서 등록하기 (무료)
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {results.db_results.map((item) =>
                    isJobResult(item) ? (
                      <JobCard key={`job-${item.id}`} job={item} />
                    ) : (
                      <ResumeCard key={`resume-${item.id}`} resume={item} />
                    )
                  )}
                </div>
              )}
            </section>

            {/* ── AI 매칭 이유 ── */}
            {results.ai_reasoning && (
              <div className={`text-xs px-4 py-2.5 rounded-lg border-l-2 ${
                results.search_type === '구인'
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-purple-300 bg-purple-50 text-purple-700'
              }`}>
                <span className="font-semibold">AI 매칭 이유:</span> {results.ai_reasoning}
              </div>
            )}

            {/* ── SECTION 2: Gemini AI 인사이트 ── */}
            {(results.ai_summary || results.ai_insights?.length > 0 || results.ai_tips?.length > 0) && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-gray-800">✨ Gemini AI 인사이트</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {GEMINI_MODEL_LABEL}
                  </span>
                </div>

                <div className={`rounded-xl p-4 border space-y-4 ${
                  results.search_type === '구인'
                    ? 'bg-blue-50 border-blue-100'
                    : 'bg-purple-50 border-purple-100'
                }`}>
                  {results.ai_summary && (
                    <p className="text-sm text-gray-700 leading-relaxed">{results.ai_summary}</p>
                  )}

                  {results.ai_insights && results.ai_insights.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">💡 시장 인사이트</p>
                      <ul className="space-y-1.5">
                        {results.ai_insights.map((insight, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className={`mt-0.5 shrink-0 font-bold ${
                              results.search_type === '구인' ? 'text-blue-500' : 'text-purple-500'
                            }`}>•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results.ai_tips && results.ai_tips.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">
                        {results.search_type === '구인' ? '📌 지원자를 위한 팁' : '📌 채용 담당자를 위한 팁'}
                      </p>
                      <ul className="space-y-1.5">
                        {results.ai_tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="mt-0.5 shrink-0 text-amber-500 font-bold">→</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 구인 카드 ────────────────────────────────────────────────────────────────

function JobCard({ job }: { job: JobDbResult }) {
  return (
    <Link href={`/jobs/${job.id}`}
      className="block border border-gray-100 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{job.company_name}</p>
        </div>
        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
          {job.job_type}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
        {job.location && (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            </svg>
            {job.location}
          </span>
        )}
        {job.salary_range && (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {job.salary_range}
          </span>
        )}
        {job.deadline && (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            ~{job.deadline}
          </span>
        )}
      </div>

      {job.requirements && (
        <p className="text-xs text-gray-400 mt-2 line-clamp-1">
          <span className="font-medium text-gray-500">자격요건:</span> {job.requirements}
        </p>
      )}
    </Link>
  )
}

// ─── 구직 카드 ────────────────────────────────────────────────────────────────

function ResumeCard({ resume }: { resume: ResumeDbResult }) {
  const skills = resume.skills?.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5) || []

  return (
    <Link href={`/resume/${resume.id}`}
      className="block border border-gray-100 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{resume.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{resume.user_name || '이름 미공개'}</p>
          {resume.education && (
            <p className="text-xs text-gray-400 mt-0.5">{resume.education}</p>
          )}
        </div>
        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
          구직자
        </span>
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {skills.map((skill) => (
            <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {skill}
            </span>
          ))}
        </div>
      )}

      {resume.experience && (
        <p className="text-xs text-gray-400 mt-2 line-clamp-2">
          <span className="font-medium text-gray-500">경력:</span> {resume.experience}
        </p>
      )}

      {resume.introduction && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">"{resume.introduction}"</p>
      )}
    </Link>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
