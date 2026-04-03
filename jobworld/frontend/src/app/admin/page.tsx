'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { api } from '@/lib/api'

interface Stats {
  total_users: number
  total_jobs: number
  total_resumes: number
  total_applications: number
  searches_today: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/dashboard').then(res => setStats(res.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-lg font-semibold mb-6">관리자 대시보드</h1>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="전체 회원" value={stats.total_users} />
            <StatCard label="채용공고" value={stats.total_jobs} />
            <StatCard label="이력서" value={stats.total_resumes} />
            <StatCard label="지원 현황" value={stats.total_applications} />
            <StatCard label="오늘 검색" value={stats.searches_today} />
          </div>
        ) : (
          <p className="text-gray-400 text-center py-12">관리자 권한이 필요합니다.</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-100 rounded-xl p-5 text-center">
      <p className="text-2xl font-bold text-blue-600">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}
