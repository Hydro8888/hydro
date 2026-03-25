'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  Clock,
  AlertTriangle,
  UserCheck,
  Link2,
  Lightbulb,
  ListTodo,
} from 'lucide-react'
import type { DashboardStats } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    {
      title: '오늘 자동 실행',
      value: stats?.todayAutomated ?? 0,
      icon: Zap,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: '승인 대기',
      value: stats?.pendingApprovals ?? 0,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      title: '실패 작업',
      value: stats?.failedTasks ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: '사용자 작업 필요',
      value: stats?.userActionNeeded ?? 0,
      icon: UserCheck,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: '연결된 채널',
      value: stats?.connectedChannels ?? 0,
      icon: Link2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: '전체 작업',
      value: stats?.totalTasks ?? 0,
      icon: ListTodo,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">대시보드</h2>
        <p className="text-muted-foreground">마케팅 운영 현황을 한눈에 확인하세요</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg p-3 ${card.bg}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {stats && stats.totalTasks === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">아직 등록된 서비스가 없습니다</h3>
            <p className="text-muted-foreground mb-4">
              서비스를 등록하고 목표를 설정하면, 적합한 채널과 작업이 자동으로 생성됩니다.
            </p>
            <a
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              서비스 등록 시작
            </a>
          </CardContent>
        </Card>
      )}

      {/* 추천 액션 */}
      {stats && stats.totalTasks > 0 && <RecommendationSection />}
    </div>
  )
}

function RecommendationSection() {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/recommendations')
      .then(res => res.json())
      .then(data => {
        if (data.success) setRecommendations(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || recommendations.length === 0) return null

  const priorityColors: Record<string, string> = {
    HIGH_FAILURE_RATE: 'border-red-200 bg-red-50',
    APPROVAL_BOTTLENECK: 'border-orange-200 bg-orange-50',
    LOW_AUTOMATION: 'border-yellow-200 bg-yellow-50',
    HIGH_REJECTION_RATE: 'border-orange-200 bg-orange-50',
    AUTOMATION_UPGRADE: 'border-green-200 bg-green-50',
    GOOD_PERFORMANCE: 'border-green-200 bg-green-50',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          추천 액션
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.slice(0, 5).map((rec, i) => (
          <div
            key={i}
            className={`rounded-lg border p-4 ${priorityColors[rec.type] || 'border-border'}`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium text-sm">{rec.title}</p>
                <p className="text-xs text-muted-foreground">{rec.reason}</p>
              </div>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                우선순위 {rec.priority}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
