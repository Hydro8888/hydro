import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      window.location.href = '/jobworld/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authAPI = {
  register: (data: RegisterData) => api.post('/auth/register', data),
  login: (data: LoginData) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// Jobs
export const jobsAPI = {
  list: (params?: JobSearchParams) => api.get('/jobs', { params }),
  get: (id: number) => api.get(`/jobs/${id}`),
  create: (data: CreateJobData) => api.post('/jobs', data),
  update: (id: number, data: Partial<CreateJobData>) => api.put(`/jobs/${id}`, data),
  delete: (id: number) => api.delete(`/jobs/${id}`),
  apply: (id: number, resumeId: number) => api.post('/applications', { job_posting_id: id, resume_id: resumeId }),
}

// Resumes
export const resumesAPI = {
  list: () => api.get('/resumes'),
  get: (id: number) => api.get(`/resumes/${id}`),
  create: (data: CreateResumeData) => api.post('/resumes', data),
  update: (id: number, data: Partial<CreateResumeData>) => api.put(`/resumes/${id}`, data),
}

// Search
export const searchAPI = {
  ai: (query: string, search_type: SearchType = 'auto') =>
    api.post('/search/ai', { query, search_type }),
  filter: (params: JobSearchParams) => api.get('/search', { params }),
}

export type SearchType = '구인' | '구직' | 'auto'

// ── Local platform results ──────────────────────────────────────────────────

export interface JobLocalResult {
  id: number
  type: '구인'
  title: string
  company_name: string
  location: string
  salary_range?: string
  job_type: string
  deadline?: string
  requirements?: string
  view_count: number
  created_at: string
  source_type?: 'local'
}

export interface ResumeLocalResult {
  id: number
  type: '구직'
  title: string
  user_name?: string
  skills?: string
  experience?: string
  education?: string
  introduction?: string
  created_at: string
  source_type?: 'local'
}

// ── External real-time results ──────────────────────────────────────────────

export interface ExternalJobResult {
  title: string
  company?: string
  location?: string
  salary?: string | null
  job_type?: string
  source: string
  url: string
  summary: string
  source_type: 'external'
}

export interface ExternalMarketResult {
  title: string
  summary: string
  source: string
  url: string
  category?: 'salary' | 'trend' | 'skill'
  source_type: 'external'
}

// ── Combined AI search response ─────────────────────────────────────────────

export interface AISearchResult {
  query: string
  search_type: '구인' | '구직'
  // Local platform data — always first
  local_results: (JobLocalResult | ResumeLocalResult)[]
  local_total: number
  // External real-time data — supplemental
  external_results: (ExternalJobResult | ExternalMarketResult)[]
  external_total: number
  // AI analysis layer
  ai_summary: string
  ai_recommended_filters: string[]
  ai_match_reasons: string[]
  ai_tips: string[]
  ai_reasoning: string
  source_labels: { local: string; external: string }
  ai_error?: string | null
}

// Legacy aliases for backward compat (keep existing code working)
export type JobDbResult = JobLocalResult
export type ResumeDbResult = ResumeLocalResult

// Types
export interface RegisterData {
  email: string
  password: string
  name: string
  user_type: 'jobseeker' | 'employer'
}

export interface LoginData {
  email: string
  password: string
}

export interface JobSearchParams {
  q?: string
  location?: string
  job_type?: string
  salary_min?: number
  page?: number
  limit?: number
}

export interface CreateJobData {
  title: string
  description: string
  location: string
  salary_range?: string
  job_type: string
  deadline?: string
  requirements?: string
  preferred?: string
}

export interface CreateResumeData {
  title: string
  education?: string
  experience?: string
  skills?: string
  introduction?: string
  is_public: boolean
}
