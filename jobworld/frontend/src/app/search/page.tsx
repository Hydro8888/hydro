'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  searchAPI,
  AISearchResult,
  JobLocalResult,
  ResumeLocalResult,
  ExternalJobResult,
  ExternalMarketResult,
} from '@/lib/api'

const GEMINI_MODEL_LABEL = 'gemini-2.5-flash'

// 배열 타입 안전 헬퍼
function safeArr<T>(val: unknown): T[] {
  return Array.isArray(val) ? (val as T[]) : []
}

function SectionHeader({
  label,
  count,
  badge,
  badgeColor,
}: {
  label: string
  count?: number
  badge?: string
  badgeColor?: 'green' | 'orange' | 'blue' | 'purple' | 'gray'
}) {
  const colors: Record<string, string> = {
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    gray: 'bg-gray-100 text-gray-600',
  }
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-sm font-bold text-gray-800">{label}</span>
      {badge && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[badgeColor ?? 'gray']}`}>
          {badge}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {count}건
        </span>
      )}
    </div>
  )
}

function LocalJobCard({ job }: { job: JobLocalResult }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block border border-gray-100 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded shrink-0">
              ✓ 플랫폼 등록
            </span>
          </div>
          <p className="text-sm text-gray-500">{job.company_name}</p>
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
        {job.deadline && <span>~{job.deadline}</span>}
      </div>
      {job.requirements && (
        <p className="text-xs text-gray-400 mt-2 line-clamp-1">
          <span className="font-medium text-gray-500">자격요건:</span> {job.requirements}
        </p>
      )}
    </Link>
  )
}

function LocalResumeCard({ resume }: { resume: ResumeLocalResult }) {
  const skills = resume.skills?.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5) ?? []
  return (
    <Link
      href={`/resume/${resume.id}`}
      className="block border border-gray-100 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-semibold text-gray-900 truncate">{resume.title}</h3>
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded shrink-0">
              ✓ 플랫폼 등록
            </span>
          </div>
          <p className="text-sm text-gray-500">{resume.user_name || '이름 미공개'}</p>
          {resume.education && <p className="text-xs text-gray-400 mt-0.5">{resume.education}</p>}
        </div>
        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full shrink-0">
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

function ExternalJobCard({ job }: { job: ExternalJobResult }) {
  return (
    <a
      href={job.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-orange-100 rounded-xl p-4 hover:border-orange-300 hover:shadow-sm transition-all bg-orange-50/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded shrink-0">
              🌐 외부
            </span>
          </div>
          {job.company && <p className="text-sm text-gray-500">{job.company}</p>}
        </div>
        {job.job_type && (
          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
            {job.job_type}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
        {job.location && <span>📍 {job.location}</span>}
        {job.salary && <span>💰 {job.salary}</span>}
        <span className="text-orange-400">출처: {job.source}</span>
      </div>
      {job.summary && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{job.summary}</p>
      )}
    </a>
  )
}

function ExternalMarketCard({ item }: { item: ExternalMarketResult }) {
  const categoryLabel: Record<string, string> = {
    salary: '💰 연봉',
    trend: '📈 트렌드',
    skill: '🛠 기술',
  }
  return (
    <a
      href={item.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-orange-100 rounded-xl p-4 hover:border-orange-300 hover:shadow-sm transition-all bg-orange-50/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded shrink-0">
              🌐 외부
            </span>
          </div>
          {item.category && (
            <span className="text-xs text-orange-500">{categoryLabel[item.category] ?? item.category}</span>
          )}
        </div>
        <span className="text-xs text-orange-400 shrink-0">{item.source}</span>
      </div>
      {item.summary && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.summary}</p>
      )}
    </a>
  )
}

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

  // useCallback으로 안정적인 함수 참조 유지 → useEffect 의존성 정확히 선언
  const doSearch = useCallback(async (searchQuery: string, type: '구인' | '구직') => {
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const res = await searchAPI.ai(searchQuery, type)
      setResults(res.data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      const msg = e.response?.data?.detail || e.message || '검색 중 오류가 발생했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (q) {
      setQuery(q)
      const t = typeParam === '구직' ? '구직' : '구인'
      setSearchType(t)
      doSearch(q, t)
    }
  }, [q, typeParam, doSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${encodeURIComponent(searchType)}`)
    }
  }

  const isJobLocal = (r: JobLocalResult | ResumeLocalResult): r is JobLocalResult => r.type === '구인'
  const isExternalJob = (r: ExternalJobResult | ExternalMarketResult): r is ExternalJobResult =>
    'company' in r || 'job_type' in r

  // 렌더링에서 안전하게 사용할 파생값
  const localResults = safeArr<JobLocalResult | ResumeLocalResult>(results?.local_results)
  const externalResults = safeArr<ExternalJobResult | ExternalMarketResult>(results?.external_results)
  const recommendedFilters = safeArr<string>(results?.ai_recommended_filters)
  const matchReasons = safeArr<string>(results?.ai_match_reasons)
  const aiTips = safeArr<string>(results?.ai_tips)
  const localTotal = results?.local_total ?? 0
  const externalTotal = results?.external_total ?? 0

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
            <div
              className={`flex-1 flex items-center border-2 rounded-full px-4 py-2 focus-within:ring-1 ${
                searchType === '구인'
                  ? 'border-blue-300 focus-within:border-blue-500 focus-within:ring-blue-100'
                  : 'border-purple-300 focus-within:border-purple-500 focus-within:ring-purple-100'
              }`}
            >
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
            <div
              className={`animate-spin w-9 h-9 border-2 border-t-transparent rounded-full mx-auto mb-3 ${
                searchType === '구인' ? 'border-blue-600' : 'border-purple-600'
              }`}
            />
            <p className="text-sm font-medium">AI가 분석 중...</p>
            <p className="text-xs mt-1 text-gray-400">
              플랫폼 DB와 실시간 외부 데이터를 동시에 검색하고 있습니다
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
            {/* 검색 뱃지 + 추천 필터 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  results.search_type === '구인' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}
              >
                {results.search_type === '구인' ? '🏢 구인 검색' : '👤 구직 검색'}
              </span>
              <span className="text-xs text-gray-400">"{results.query}"</span>
              {recommendedFilters.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() =>
                    router.push(`/search?q=${encodeURIComponent(f)}&type=${encodeURIComponent(searchType)}`)
                  }
                  className="text-xs border border-gray-200 text-gray-500 px-2.5 py-0.5 rounded-full hover:bg-gray-50 transition-colors"
                >
                  {f}
                </button>
              ))}
            </div>

            {/* 복합 결과 상태 배너 */}
            {localTotal === 0 && externalTotal > 0 && (
              <div className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                플랫폼 등록 결과는 없지만, 실시간 웹 검색 결과를 찾았습니다.
              </div>
            )}
            {localTotal === 0 && externalTotal === 0 && (
              <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                플랫폼 등록 결과와 실시간 웹 검색 결과를 찾지 못했습니다. 다른 검색어를 시도해 보세요.
              </div>
            )}

            {/* ── SECTION 1: 플랫폼 등록 결과 ── */}
            <section>
              <SectionHeader
                label={results.search_type === '구인' ? '📋 플랫폼 등록 채용공고' : '📄 플랫폼 등록 이력서'}
                badge={results.source_labels?.local ?? '플랫폼 등록 결과'}
                badgeColor="green"
                count={localTotal}
              />

              {localTotal === 0 ? (
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
                  {localResults.map((item) =>
                    isJobLocal(item) ? (
                      <LocalJobCard key={`local-job-${item.id}`} job={item} />
                    ) : (
                      <LocalResumeCard key={`local-resume-${item.id}`} resume={item} />
                    )
                  )}
                </div>
              )}
            </section>

            {/* ── SECTION 2: 실시간 외부 검색 결과 ── */}
            <section>
              <SectionHeader
                label={results.search_type === '구인' ? '🌐 실시간 외부 채용공고' : '🌐 실시간 시장 정보'}
                badge={results.source_labels?.external ?? '실시간 외부 검색 결과'}
                badgeColor="orange"
                count={externalTotal}
              />
              {externalTotal === 0 ? (
                <div className="text-center py-8 bg-orange-50/50 rounded-xl border border-orange-100 text-gray-400 text-xs">
                  <p className="text-sm font-medium text-orange-400">실시간 외부 검색 결과가 없습니다</p>
                  {results.ai_error ? (
                    <p className="mt-1 text-amber-600">AI 검색 오류: {results.ai_error}</p>
                  ) : (
                    <p className="mt-1">AI 검색이 결과를 반환하지 않았습니다.</p>
                  )}
                  <p className="mt-0.5 text-gray-400">다른 검색어를 시도하거나 플랫폼에 채용공고를 등록해 보세요.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {externalResults.map((item, i) =>
                    isExternalJob(item) ? (
                      <ExternalJobCard key={`ext-job-${i}`} job={item as ExternalJobResult} />
                    ) : (
                      <ExternalMarketCard key={`ext-market-${i}`} item={item as ExternalMarketResult} />
                    )
                  )}
                </div>
              )}
            </section>

            {/* ── SECTION 3: AI 분석 ── */}
            {(results.ai_summary || matchReasons.length > 0 || aiTips.length > 0) && (
              <section>
                <SectionHeader
                  label="✨ AI 분석"
                  badgeColor={results.search_type === '구인' ? 'blue' : 'purple'}
                />

                <div
                  className={`rounded-xl p-4 border space-y-4 ${
                    results.search_type === '구인'
                      ? 'bg-blue-50 border-blue-100'
                      : 'bg-purple-50 border-purple-100'
                  }`}
                >
                  {results.ai_summary && (
                    <p className="text-sm text-gray-700 leading-relaxed">{results.ai_summary}</p>
                  )}

                  {matchReasons.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">🎯 매칭 이유</p>
                      <ul className="space-y-1.5">
                        {matchReasons.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span
                              className={`mt-0.5 shrink-0 font-bold ${
                                results.search_type === '구인' ? 'text-blue-500' : 'text-purple-500'
                              }`}
                            >
                              •
                            </span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiTips.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">
                        {results.search_type === '구인' ? '📌 지원자를 위한 팁' : '📌 채용 담당자를 위한 팁'}
                      </p>
                      <ul className="space-y-1.5">
                        {aiTips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="mt-0.5 shrink-0 text-amber-500 font-bold">→</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results.ai_reasoning && (
                    <div
                      className={`text-xs px-3 py-2 rounded-lg border-l-2 ${
                        results.search_type === '구인'
                          ? 'border-blue-300 bg-blue-100/50 text-blue-700'
                          : 'border-purple-300 bg-purple-100/50 text-purple-700'
                      }`}
                    >
                      <span className="font-semibold">AI 분석:</span> {results.ai_reasoning}
                    </div>
                  )}

                  {results.ai_error && (
                    <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                      ⚠️ AI 분석 일부 제한: {results.ai_error}
                    </p>
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

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
