'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/common/status-badge'
import { AutomationGradeBadge } from '@/components/common/automation-grade-badge'
import { UserCheck } from 'lucide-react'

const STATUS_TABS = [
  { value: '', label: '전체' },
  { value: 'CREATED', label: '생성됨' },
  { value: 'ASSIGNED', label: '배정됨' },
  { value: 'IN_PROGRESS', label: '진행 중' },
  { value: 'EVIDENCE_PENDING', label: '증빙 대기' },
  { value: 'REVIEW_PENDING', label: '검수 대기' },
  { value: 'COMPLETED', label: '완료' },
]

export default function AssistedTasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/assisted-tasks?${params}`)
      .then(res => res.json())
      .then(data => { if (data.success) setTasks(data.data) })
      .finally(() => setLoading(false))
  }, [statusFilter])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">반자동 작업 센터</h2>
        <p className="text-muted-foreground">담당자가 직접 수행해야 하는 작업을 관리합니다</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(tab => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center">
            <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">반자동 작업이 없습니다</h3>
            <p className="text-muted-foreground">C등급 작업이 생성되면 여기에 표시됩니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((at: any) => {
            const checklist = at.checklist as any[] || []
            const completedCount = checklist.filter((c: any) => c.completed).length

            return (
              <Link key={at.id} href={`/assisted/${at.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{at.task.title}</span>
                          <AutomationGradeBadge grade="C" />
                        </div>
                        {at.task.channelConnection?.channel && (
                          <p className="text-sm text-muted-foreground">
                            채널: {at.task.channelConnection.channel.displayName}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-muted-foreground">
                            담당자: {at.assignee ? at.assignee.name : '미배정'}
                          </span>
                          {checklist.length > 0 && (
                            <Badge variant="outline">
                              체크리스트 {completedCount}/{checklist.length}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={at.status} type="assisted" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
