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

function safeArr<T>(val: unknown): T[] {
  return Array.isArray(val) ? (val as T[]) : []
}

function LocalJobCard({ job }: { job: JobLocalResult }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block bg-white border border-[#dfe3e8] rounded-xl p-4 hover:border-[#1a73e8] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-medium text-[#1c1c1c] truncate">{job.title}</h3>
            <span className="text-xs bg-[#e8f0fe] text-[#1a73e8] px-1.5 py-0.5 rounded shrink-0">플랫폼</span>
          </div>
          <p className="text-sm text-[#5f6368]">{job.company_name}</p>
        </div>
        <span className="text-xs bg-[#eef1f6] text-[#5f6368] px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap border border-[#dfe3e8]">
          {job.job_type}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-[#9b9b9b]">
        {job.location && <span>{job.location}</span>}
        {job.salary_range && <span>{job.salary_range}</span>}
        {job.deadline && <span>~{job.deadline}</span>}
      </div>
      {job.requirements && (
        <p className="text-xs text-[#9b9b9b] mt-2 line-clamp-1">
          <span className="font-medium text-[#5f6368]">자격요건:</span> {job.requirements}
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
      className="block bg-white border border-[#dfe3e8] rounded-xl p-4 hover:border-[#1a73e8] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-medium text-[#1c1c1c] truncate">{resume.title}</h3>
            <span className="text-xs bg-[#e8f0fe] text-[#1a73e8] px-1.5 py-0.5 rounded shrink-0">플랫폼</span>
          </div>
          <p className="text-sm text-[#5f6368]">{resume.user_name || '이름 미공개'}</p>
          {resume.education && <p className="text-xs text-[#9b9b9b] mt-0.5">{resume.education}</p>}
        </div>
        <span className="text-xs bg-[#eef1f6] text-[#5f6368] px-2 py-0.5 rounded-full shrink-0 border border-[#dfe3e8]">구직자</span>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {skills.map((skill) => (
            <span key={skill} className="text-xs bg-[#eef1f6] text-[#5f6368] px-2 py-0.5 rounded-full border border-[#dfe3e8]">
              {skill}
            </span>
          ))}
        </div>
      )}
      {resume.experience && (
        <p className="text-xs text-[#9b9b9b] mt-2 line-clamp-2">
          <span className="font-medium text-[#5f6368]">경력:</span> {resume.experience}
        </p>
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
      className="block bg-white border border-[#dfe3e8] rounded-xl p-4 hover:border-[#1a73e8] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-medium text-[#1c1c1c] truncate">{job.title}</h3>
            <span className="text-xs bg-[#eef1f6] text-[#5f6368] px-1.5 py-0.5 rounded shrink-0">외부</span>
          </div>
          {job.company && <p className="text-sm text-[#5f6368]">{job.company}</p>}
        </div>
        {job.job_type && (
          <span className="text-xs text-[#5f6368] px-2 py-0.5 rounded-full bg-[#eef1f6] border border-[#dfe3e8] shrink-0 whitespace-nowrap">
            {job.job_type}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-[#9b9b9b]">
        {job.location && <span>{job.location}</span>}
        {job.salary && <span>{job.salary}</span>}
        <span className="text-[#1a73e8]">{job.source}</span>
      </div>
      {job.summary && (
        <p className="text-xs text-[#5f6368] mt-2 line-clamp-2">{job.summary}</p>
      )}
    </a>
  )
}

function ExternalMarketCard({ item }: { item: ExternalMarketResult }) {
  return (
    <a
      href={item.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border border-[#dfe3e8] rounded-xl p-4 hover:border-[#1a73e8] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-[#1c1c1c] truncate">{item.title}</h3>
          {item.category && (
            <span className="text-xs text-[#1a73e8]">{item.category}</span>
          )}
        </div>
        <span className="text-xs text-[#9b9b9b] shrink-0">{item.source}</span>
      </div>
      {item.summary && (
        <p className="text-xs text-[#5f6368] mt-2 line-clamp-2">{item.summary}</p>
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

  const doSearch = useCallback(async (searchQuery: string, type: '구인' | '구직') => {
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const res = await searchAPI.ai(searchQuery, type)
      setResults(res.data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string }
      setError(e.response?.data?.detail || e.message || '검색 중 오류가 발생했습니다.')
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

  const localResults = safeArr<JobLocalResult | ResumeLocalResult>(results?.local_results)
  const externalResults = safeArr<ExternalJobResult | ExternalMarketResult>(results?.external_results)
  const recommendedFilters = safeArr<string>(results?.ai_recommended_filters)
  const matchReasons = safeArr<string>(results?.ai_match_reasons)
  const aiTips = safeArr<string>(results?.ai_tips)
  const localTotal = results?.local_total ?? 0
  const externalTotal = results?.external_total ?? 0

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header />

      {/* 검색 바 */}
      <div className="border-b border-[#dfe3e8] py-4 px-4 bg-[#f5f7fa]">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto space-y-2">
          <div className="flex gap-2 mb-2">
            {(['구인', '구직'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSearchType(type)}
                className={`px-4 py-1 rounded-full text-xs font-medium transition-colors border ${
                  searchType === type
                    ? 'bg-[#1a73e8] text-white border-[#1a73e8]'
                    : 'text-[#5f6368] border-[#dfe3e8] hover:border-[#1a73e8]'
                }`}
              >
                {type === '구인' ? '구인 검색' : '구직자 검색'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-white border border-[#dfe3e8] rounded-xl px-4 py-2 focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8]/30 transition-all">
              <svg className="w-4 h-4 text-[#9b9b9b] mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchType === '구인' ? '직무, 기술, 지역, 연봉으로 검색...' : '기술스택, 경력, 직종으로 구직자 검색...'}
                className="flex-1 outline-none text-sm text-[#1c1c1c] bg-transparent placeholder-[#9b9b9b]"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1a73e8] text-white text-sm font-medium rounded-xl hover:bg-[#1557b0] transition-colors"
            >
              검색
            </button>
          </div>
        </form>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 로딩 */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin w-7 h-7 border-2 border-[#1a73e8] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-[#5f6368] font-medium">AI가 분석 중...</p>
            <p className="text-xs mt-1 text-[#9b9b9b]">플랫폼 DB와 실시간 외부 데이터를 동시에 검색하고 있습니다</p>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="text-center py-10 bg-white rounded-xl border border-[#dfe3e8]">
            <p className="text-[#d93025] text-sm">{error}</p>
            <button type="button" onClick={() => doSearch(q, searchType)} className="mt-3 text-xs text-[#1a73e8] underline">
              다시 시도
            </button>
          </div>
        )}

        {results && !loading && (
          <div className="space-y-8">
            {/* 검색 정보 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#1a73e8] text-white">
                {results.search_type === '구인' ? '구인 검색' : '구직 검색'}
              </span>
              <span className="text-xs text-[#9b9b9b]">"{results.query}"</span>
              {recommendedFilters.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => router.push(`/search?q=${encodeURIComponent(f)}&type=${encodeURIComponent(searchType)}`)}
                  className="text-xs border border-[#dfe3e8] text-[#5f6368] px-2.5 py-0.5 rounded-full hover:border-[#1a73e8] transition-colors"
                >
                  {f}
                </button>
              ))}
            </div>

            {localTotal === 0 && externalTotal > 0 && (
              <div className="text-xs text-[#1a73e8] bg-[#e8f0fe] border border-[#c4d7f5] rounded-xl px-3 py-2">
                플랫폼 등록 결과는 없지만, 실시간 웹 검색 결과를 찾았습니다.
              </div>
            )}
            {localTotal === 0 && externalTotal === 0 && (
              <div className="text-xs text-[#5f6368] bg-white border border-[#dfe3e8] rounded-xl px-3 py-2">
                검색 결과를 찾지 못했습니다. 다른 검색어를 시도해 보세요.
              </div>
            )}

            {/* 플랫폼 등록 결과 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-[#1c1c1c]">
                  {results.search_type === '구인' ? '플랫폼 채용공고' : '플랫폼 이력서'}
                </span>
                <span className="text-xs bg-[#e8f0fe] text-[#1a73e8] px-2 py-0.5 rounded-full font-medium">
                  {results.source_labels?.local ?? '플랫폼'}
                </span>
                <span className="text-xs text-[#9b9b9b]">{localTotal}건</span>
              </div>
              {localTotal === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl text-[#9b9b9b] text-sm border border-[#dfe3e8]">
                  <p>등록된 {results.search_type === '구인' ? '채용공고' : '이력서'}가 없습니다.</p>
                  {results.search_type === '구인' ? (
                    <Link href="/jobs/post" className="text-[#1a73e8] mt-1 block hover:underline text-xs">
                      채용공고 등록하기 (무료)
                    </Link>
                  ) : (
                    <Link href="/resume/new" className="text-[#1a73e8] mt-1 block hover:underline text-xs">
                      이력서 등록하기 (무료)
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
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

            {/* 실시간 외부 결과 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-[#1c1c1c]">
                  {results.search_type === '구인' ? '실시간 채용공고' : '실시간 시장 정보'}
                </span>
                <span className="text-xs bg-[#eef1f6] text-[#5f6368] px-2 py-0.5 rounded-full font-medium border border-[#dfe3e8]">
                  {results.source_labels?.external ?? '외부'}
                </span>
                <span className="text-xs text-[#9b9b9b]">{externalTotal}건</span>
              </div>
              {externalTotal === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-[#dfe3e8] text-[#9b9b9b] text-xs">
                  {results.ai_error ? (
                    <p className="text-[#d93025]">AI 검색 오류: {results.ai_error}</p>
                  ) : (
                    <p>실시간 외부 검색 결과가 없습니다.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
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

            {/* AI 분석 */}
            {(results.ai_summary || matchReasons.length > 0 || aiTips.length > 0) && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-[#1c1c1c]">AI 분석</span>
                  <span className="text-xs bg-[#e8f0fe] text-[#1a73e8] px-2 py-0.5 rounded-full font-medium">Gemini</span>
                </div>
                <div className="bg-white border border-[#dfe3e8] rounded-xl p-5 space-y-4">
                  {results.ai_summary && (
                    <p className="text-sm text-[#1c1c1c] leading-relaxed">{results.ai_summary}</p>
                  )}
                  {matchReasons.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#5f6368] mb-1.5 uppercase tracking-wide">매칭 이유</p>
                      <ul className="space-y-1.5">
                        {matchReasons.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#5f6368]">
                            <span className="mt-0.5 shrink-0 text-[#1a73e8] font-bold">·</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiTips.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#5f6368] mb-1.5 uppercase tracking-wide">
                        {results.search_type === '구인' ? '지원자를 위한 팁' : '채용 담당자를 위한 팁'}
                      </p>
                      <ul className="space-y-1.5">
                        {aiTips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[#5f6368]">
                            <span className="mt-0.5 shrink-0 text-[#1a73e8] font-bold">→</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results.ai_error && (
                    <p className="text-xs text-[#d93025]">⚠ AI 분석 일부 제한: {results.ai_error}</p>
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
        <div className="flex items-center justify-center min-h-screen bg-[#f5f7fa]">
          <div className="animate-spin w-7 h-7 border-2 border-[#1a73e8] border-t-transparent rounded-full" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
