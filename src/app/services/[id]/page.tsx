'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/common/status-badge'
import { AutomationGradeBadge } from '@/components/common/automation-grade-badge'
import { ServiceTypeLabel } from '@/lib/constants/enums'
import type { AutomationGrade } from '@/lib/constants/enums'

export default function ServiceDetailPage() {
  const params = useParams()
  const [service, setService] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/services/${params.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setService(data.data)
        })
        .finally(() => setLoading(false))
    }
  }, [params.id])

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-40 bg-muted rounded" />
    </div>
  }

  if (!service) {
    return <p>서비스를 찾을 수 없습니다.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{service.name}</h2>
        <p className="text-muted-foreground">
          {ServiceTypeLabel[service.type as keyof typeof ServiceTypeLabel]}
          {service.isLocal && ' | 로컬 비즈니스'}
          {service.isApp && ' | 앱 기반'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="font-medium">소개:</span> {service.description}</p>
            {service.url && <p><span className="font-medium">URL:</span> {service.url}</p>}
            {service.appUrl && <p><span className="font-medium">앱 URL:</span> {service.appUrl}</p>}
          </CardContent>
        </Card>

        {/* 브랜드 자산 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">브랜드 자산</CardTitle>
            <CardDescription>{service.assets.length}개 자산</CardDescription>
          </CardHeader>
          <CardContent>
            {service.assets.length === 0 ? (
              <p className="text-sm text-muted-foreground">등록된 자산이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {service.assets.map((asset: any) => (
                  <div key={asset.id} className="flex items-center gap-2">
                    <Badge variant="outline">{asset.type}</Badge>
                    <span className="text-sm">{asset.name}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 목표 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">운영 목표</CardTitle>
          </CardHeader>
          <CardContent>
            {service.goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">설정된 목표가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {service.goals.map((goal: any) => (
                  <div key={goal.id} className="rounded-lg border p-3">
                    <p className="font-medium text-sm">{goal.description}</p>
                    {Array.isArray(goal.subGoals) && goal.subGoals.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {goal.subGoals.map((sg: any) => (
                          <Badge key={sg.id} variant="secondary" className="text-xs">
                            {sg.description}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 연결된 채널 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">연결된 채널</CardTitle>
          </CardHeader>
          <CardContent>
            {service.channelConnections.length === 0 ? (
              <p className="text-sm text-muted-foreground">연결된 채널이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {service.channelConnections.map((conn: any) => (
                  <div key={conn.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{conn.channel.displayName}</span>
                      <AutomationGradeBadge grade={conn.channel.automationCapability as AutomationGrade} />
                    </div>
                    <StatusBadge status={conn.status} type="channel" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 최근 작업 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">최근 작업</CardTitle>
        </CardHeader>
        <CardContent>
          {service.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">생성된 작업이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {service.tasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.errorReason && (
                      <p className="text-xs text-red-600">실패 사유: {task.errorReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <AutomationGradeBadge grade={task.automationGrade as AutomationGrade} />
                    <StatusBadge status={task.status} type="task" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
