'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Link2,
  Layers,
  CheckSquare,
  UserCheck,
  Zap,
  Target,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
} from 'lucide-react'
import type { PipelineStatus, PipelineStage } from '@/types'

const STAGE_ICONS: Record<string, any> = {
  Search, Link2, Layers, CheckSquare, UserCheck, Zap, Target,
}

const HEALTH_STYLES: Record<string, { border: string; bg: string; dot: string; text: string }> = {
  healthy: { border: 'border-green-200', bg: 'bg-green-50', dot: 'bg-green-500', text: 'text-green-700' },
  warning: { border: 'border-yellow-200', bg: 'bg-yellow-50', dot: 'bg-yellow-500', text: 'text-yellow-700' },
  critical: { border: 'border-red-200', bg: 'bg-red-50', dot: 'bg-red-500', text: 'text-red-700' },
}

const DETAIL_LABELS: Record<string, Record<string, string>> = {
  '1': { total: '전체', connected: '연결됨', available: '미연결' },
  '2': { connected: '연결', failed: '실패', total: '전체' },
  '3': { gradeA: 'A등급', gradeB: 'B등급', gradeC: 'C등급', createdToday: '오늘 생성' },
  '4': { pending: '대기', reviewing: '검토 중', approved: '승인', rejected: '반려', expired: '만료', avgWaitHours: '평균(h)' },
  '5': { created: '생성', assigned: '배정', inProgress: '진행 중', completed: '완료', unassigned: '미할당' },
  '6': { running: '실행 중', completedToday: '오늘 완료', failedToday: '오늘 실패', successRate: '성공률%' },
  '7': { completed: '완료', failed: '실패', total: '전체', byGradeA: 'A등급', byGradeB: 'B등급', byGradeC: 'C등급' },
}

export default function PipelinePage() {
  const [data, setData] = useState<PipelineStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [services, setServices] = useState<{ id: string; name: string }[]>([])
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedStage, setSelectedStage] = useState<number | null>(null)
  const router = useRouter()

  // 서비스 목록 로드
  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(d => { if (d.success) setServices(d.data || []) })
      .catch(() => {})
  }, [])

  // 파이프라인 데이터 로드
  useEffect(() => {
    setLoading(true)
    setError(null)
    const url = selectedService
      ? `/api/pipeline/status?serviceId=${selectedService}`
      : '/api/pipeline/status'
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d.data)
        else setError('파이프라인 데이터를 불러올 수 없습니다')
      })
      .catch(() => setError('서버와 연결할 수 없습니다'))
      .finally(() => setLoading(false))
  }, [selectedService])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">파이프라인 모니터링</h2>
          <p className="text-muted-foreground">채널 수집부터 결과까지 전체 흐름을 한눈에 확인하세요</p>
        </div>
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={selectedService}
          onChange={e => setSelectedService(e.target.value)}
        >
          <option value="">전체 서비스</option>
          {services.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-12 bg-muted rounded" /></CardContent></Card>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
            {[...Array(7)].map((_, i) => (
              <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-24 bg-muted rounded" /></CardContent></Card>
            ))}
          </div>
        </div>
      ) : data && (
        <>
          {/* 요약 카드 */}
          <SummaryCards summary={data.summary} />

          {/* 7단계 파이프라인 플로우 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                실행 파이프라인
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
                {data.stages.map((stage, i) => (
                  <div key={stage.stage} className="flex items-stretch">
                    <StageCard
                      stage={stage}
                      isSelected={selectedStage === stage.stage}
                      onClick={() => setSelectedStage(selectedStage === stage.stage ? null : stage.stage)}
                      onNavigate={() => router.push(stage.actionUrl)}
                    />
                    {i < data.stages.length - 1 && (
                      <div className="flex items-center px-1">
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 병목 알림 */}
          {data.bottleneck && (
            <Card className={`${HEALTH_STYLES[data.stages.find(s => s.stage === data.bottleneck!.stage)?.health || 'warning'].border} ${HEALTH_STYLES[data.stages.find(s => s.stage === data.bottleneck!.stage)?.health || 'warning'].bg}`}>
              <CardContent className="flex items-center gap-3 p-4">
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    Stage {data.bottleneck.stage} &middot; {data.bottleneck.title}에서 병목 감지
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{data.bottleneck.reason}</p>
                </div>
                <button
                  onClick={() => {
                    const stageUrl = data.stages.find(s => s.stage === data.bottleneck!.stage)?.actionUrl
                    if (stageUrl) router.push(stageUrl)
                  }}
                  className="text-xs text-primary underline flex-shrink-0"
                >
                  바로가기
                </button>
              </CardContent>
            </Card>
          )}

          {/* 하단: 선택된 단계 상세 + 최근 활동 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 단계 상세 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedStage
                    ? `Stage ${selectedStage} 상세`
                    : '단계를 선택하세요'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedStage ? (
                  <StageDetail stage={data.stages.find(s => s.stage === selectedStage)!} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    위 파이프라인에서 단계를 클릭하면 상세 정보가 표시됩니다
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 최근 활동 타임라인 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  최근 활동
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">아직 활동 내역이 없습니다</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {data.recentActivity.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

// ===== 컴포넌트들 =====

function SummaryCards({ summary }: { summary: PipelineStatus['summary'] }) {
  const cards = [
    { label: '연결된 채널', value: summary.totalChannels, icon: Link2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '전체 작업', value: summary.totalTasks, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '완료율', value: `${summary.completionRate}%`, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '자동화율', value: `${summary.automationRate}%`, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map(card => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`rounded-lg p-2.5 ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StageCard({
  stage,
  isSelected,
  onClick,
  onNavigate,
}: {
  stage: PipelineStage
  isSelected: boolean
  onClick: () => void
  onNavigate: () => void
}) {
  const Icon = STAGE_ICONS[stage.icon] || Target
  const style = HEALTH_STYLES[stage.health]

  return (
    <div
      className={`flex flex-col items-center rounded-lg border-2 p-3 min-w-[120px] cursor-pointer transition-all ${style.border} ${isSelected ? style.bg : 'bg-card hover:' + style.bg}`}
      onClick={onClick}
      onDoubleClick={onNavigate}
    >
      {/* 단계 번호 + 건강도 */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold text-white ${style.dot.replace('bg-', 'bg-')}`}>
          {stage.stage}
        </span>
        <span className="text-xs font-medium text-muted-foreground">{stage.title}</span>
      </div>

      {/* 아이콘 + 대표 수치 */}
      <Icon className={`h-6 w-6 mb-1 ${style.text}`} />
      <p className="text-2xl font-bold leading-none">{stage.primaryMetric}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{stage.primaryLabel}</p>

      {/* 건강도 점 */}
      <div className="flex items-center gap-1 mt-2">
        <div className={`h-2 w-2 rounded-full ${style.dot}`} />
        <span className={`text-[10px] ${style.text}`}>
          {stage.health === 'healthy' ? '정상' : stage.health === 'warning' ? '주의' : '위험'}
        </span>
      </div>
    </div>
  )
}

function StageDetail({ stage }: { stage: PipelineStage }) {
  const Icon = STAGE_ICONS[stage.icon] || Target
  const style = HEALTH_STYLES[stage.health]
  const labels = DETAIL_LABELS[String(stage.stage)] || {}

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${style.bg}`}>
          <Icon className={`h-5 w-5 ${style.text}`} />
        </div>
        <div>
          <p className="font-semibold">Stage {stage.stage}: {stage.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`h-2 w-2 rounded-full ${style.dot}`} />
            <span className={`text-xs ${style.text}`}>
              {stage.health === 'healthy' ? '정상 운영 중' : stage.health === 'warning' ? '주의 필요' : '즉시 확인 필요'}
            </span>
          </div>
        </div>
      </div>

      {/* 대표 수치 */}
      <div className={`rounded-lg p-4 text-center ${style.bg}`}>
        <p className="text-4xl font-bold">{stage.primaryMetric}</p>
        <p className="text-sm text-muted-foreground mt-1">{stage.primaryLabel}</p>
      </div>

      {/* 세부 카운트 */}
      {Object.keys(stage.details).length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(stage.details).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-xs text-muted-foreground">{labels[key] || key}</span>
              <span className="text-sm font-semibold">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActivityItem({ activity }: { activity: PipelineStatus['recentActivity'][0] }) {
  const entityIcons: Record<string, any> = {
    Task: Layers,
    ApprovalRequest: CheckSquare,
    AssistedTask: UserCheck,
    ChannelConnection: Link2,
    Service: Search,
  }
  const Icon = entityIcons[activity.entityType] || Activity

  const timeAgo = getTimeAgo(activity.timestamp)

  return (
    <div className="flex items-start gap-3">
      <div className="rounded-full bg-muted p-1.5 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{activity.description}</p>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
    </div>
  )
}

function getTimeAgo(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}
