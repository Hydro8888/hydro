'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/common/status-badge'
import { Activity, AlertTriangle, Zap, Clock, UserCheck, ShieldAlert } from 'lucide-react'
import { apiUrl } from '@/lib/api'

const priorityColors: Record<string, string> = {
  URGENT: 'border-red-300 bg-red-50',
  IMPORTANT: 'border-orange-300 bg-orange-50',
  NORMAL: 'border-blue-300 bg-blue-50',
}

export default function OperationsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(apiUrl('/api/monitoring'))
      .then(res => res.json())
      .then(d => { if (d.success) setData(d.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">운영 센터</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-16 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  const metrics = data?.metrics
  const alerts = data?.alerts || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">운영 센터</h2>
        <p className="text-muted-foreground">실시간 운영 현황을 모니터링합니다</p>
      </div>

      {/* 핵심 지표 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg p-3 bg-green-50"><Zap className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">자동화율</p>
              <p className="text-3xl font-bold">{metrics?.automationRate || 0}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg p-3 bg-red-50"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">실패율</p>
              <p className="text-3xl font-bold">{metrics?.failureRate || 0}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg p-3 bg-blue-50"><Clock className="h-6 w-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">승인 평균</p>
              <p className="text-3xl font-bold">{metrics?.avgApprovalHours ?? '-'}h</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg p-3 bg-purple-50"><UserCheck className="h-6 w-6 text-purple-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">반자동 완료율</p>
              <p className="text-3xl font-bold">{metrics?.assistedCompletionRate || 0}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 작업 상태 분포 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">작업 상태 분포</CardTitle></CardHeader>
          <CardContent>
            {metrics?.taskDistribution?.length > 0 ? (
              <div className="space-y-2">
                {metrics.taskDistribution.map((t: any) => (
                  <div key={t.status} className="flex items-center justify-between">
                    <StatusBadge status={t.status} type="task" />
                    <span className="font-medium">{t.count}건</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">작업 데이터가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* 자동화 등급 분포 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">자동화 등급 분포</CardTitle></CardHeader>
          <CardContent>
            {metrics?.gradeDistribution?.length > 0 ? (
              <div className="space-y-3">
                {metrics.gradeDistribution.map((g: any) => {
                  const total = metrics.gradeDistribution.reduce((s: number, x: any) => s + x.count, 0) || 1
                  const pct = Math.round(g.count / total * 100)
                  const colors: Record<string, string> = { A: 'bg-green-500', B: 'bg-yellow-500', C: 'bg-blue-500' }
                  return (
                    <div key={g.grade} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{g.grade} - {g.grade === 'A' ? 'Autopilot' : g.grade === 'B' ? 'Approval' : 'Assisted'}</span>
                        <span>{g.count}건 ({pct}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full ${colors[g.grade] || 'bg-gray-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">등급 데이터가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* 채널 상태 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">채널 연결 상태</CardTitle></CardHeader>
          <CardContent>
            {metrics?.channelStatus?.length > 0 ? (
              <div className="space-y-2">
                {metrics.channelStatus.map((c: any) => (
                  <div key={c.status} className="flex items-center justify-between">
                    <StatusBadge status={c.status} type="channel" />
                    <span className="font-medium">{c.count}개</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">연결된 채널이 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* 경고 이벤트 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">경고 이벤트</CardTitle>
              {alerts.length > 0 && <Badge variant="destructive">{alerts.length}</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">현재 경고가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 8).map((alert: any) => (
                  <div key={alert.id} className={`rounded-lg border p-3 ${priorityColors[alert.priority] || ''}`}>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium">{alert.title}</span>
                      <Badge variant={alert.priority === 'URGENT' ? 'destructive' : 'outline'} className="text-xs">
                        {alert.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 최근 실패 작업 */}
      {metrics?.recentFailures?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">최근 실패 작업</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.recentFailures.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3">
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-red-600">{t.errorReason || '원인 미상'}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">재시도 {t.retryCount}/{t.maxRetries}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
