'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/common/status-badge'
import { AutomationGradeBadge } from '@/components/common/automation-grade-badge'
import { DiffViewer } from '@/components/common/diff-viewer'
import { TaskTypeLabel } from '@/lib/constants/enums'
import type { AutomationGrade } from '@/lib/constants/enums'
import { getTaskNextActions } from '@/lib/states/task-state'
import type { TaskStatus } from '@/lib/constants/enums'
import { ArrowLeft, Loader2, RefreshCw, ExternalLink } from 'lucide-react'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [task, setTask] = useState<any>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  function loadTask() {
    if (!params.id) return
    fetch(`/api/tasks/${params.id}`)
      .then(res => res.json())
      .then(data => { if (data.success) setTask(data.data) })
      .finally(() => setLoading(false))

    fetch(`/api/audit?entityType=Task&entityId=${params.id}`)
      .then(res => res.json())
      .then(data => { if (data.success) setAuditLogs(data.data.logs || []) })
      .catch(() => {})
  }

  useEffect(() => { loadTask() }, [params.id])

  async function handleStatusChange(newStatus: string) {
    setActionLoading(true)
    try {
      await fetch(`/api/tasks/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      loadTask()
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-60 bg-muted rounded" />
    </div>
  }

  if (!task) return <p>작업을 찾을 수 없습니다.</p>

  const nextActions = getTaskNextActions(task.status as TaskStatus)

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => router.push('/tasks')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> 작업 센터로 돌아가기
      </Button>

      {/* 헤더 */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{task.title}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <AutomationGradeBadge grade={task.automationGrade as AutomationGrade} showDescription />
          <StatusBadge status={task.status} type="task" />
          <Badge variant="outline">{TaskTypeLabel[task.type as keyof typeof TaskTypeLabel] || task.type}</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 기본 정보 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">작업 정보</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {task.channelConnection?.channel && (
              <p><span className="font-medium">채널:</span> {task.channelConnection.channel.displayName}</p>
            )}
            {task.description && <p><span className="font-medium">설명:</span> {task.description}</p>}
            <p><span className="font-medium">재시도:</span> {task.retryCount}/{task.maxRetries}</p>
            {task.scheduledAt && <p><span className="font-medium">예약:</span> {new Date(task.scheduledAt).toLocaleString('ko-KR')}</p>}
            {task.completedAt && <p><span className="font-medium">완료:</span> {new Date(task.completedAt).toLocaleString('ko-KR')}</p>}
            <p><span className="font-medium">생성:</span> {new Date(task.createdAt).toLocaleString('ko-KR')}</p>
          </CardContent>
        </Card>

        {/* 실패 사유 / 상태 액션 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">상태 관리</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {task.errorReason && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm font-medium text-red-600">실패 사유</p>
                <p className="text-sm mt-1">{task.errorReason}</p>
              </div>
            )}

            {nextActions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {nextActions.map(action => (
                  <Button
                    key={action.targetStatus}
                    size="sm"
                    variant={action.targetStatus === 'RETRY_PENDING' ? 'default' : 'outline'}
                    onClick={() => handleStatusChange(action.targetStatus)}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 관련 승인/반자동 */}
      {task.approvalRequest && (
        <Card>
          <CardHeader><CardTitle className="text-lg">관련 승인 요청</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <StatusBadge status={task.approvalRequest.status} type="approval" />
              <Link href={`/approvals/${task.approvalRequest.id}`}>
                <Button variant="outline" size="sm">
                  승인 상세 보기 <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {task.assistedTask && (
        <Card>
          <CardHeader><CardTitle className="text-lg">관련 반자동 작업</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <StatusBadge status={task.assistedTask.status} type="assisted" />
              <Link href={`/assisted/${task.assistedTask.id}`}>
                <Button variant="outline" size="sm">
                  반자동 작업 보기 <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 감사 이력 */}
      {auditLogs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">변경 이력</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{log.action}</Badge>
                    <span className="text-muted-foreground">{log.user?.name || '시스템'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString('ko-KR')}</span>
                </div>
                {(log.before || log.after) && (
                  <DiffViewer before={log.before} after={log.after} />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
