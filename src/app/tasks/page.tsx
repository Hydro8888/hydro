'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { StatusBadge } from '@/components/common/status-badge'
import { AutomationGradeBadge } from '@/components/common/automation-grade-badge'
import { Badge } from '@/components/ui/badge'
import { TaskStatusLabel, AutomationGradeLabel, TaskTypeLabel } from '@/lib/constants/enums'
import type { AutomationGrade, TaskStatus } from '@/lib/constants/enums'
import { ListTodo, RefreshCw } from 'lucide-react'

export default function TasksPage() {
  const [services, setServices] = useState<any[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [tasks, setTasks] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setServices(data.data)
          setSelectedServiceId(data.data[0].id)
        }
      })
  }, [])

  useEffect(() => {
    if (selectedServiceId) {
      loadTasks()
    }
  }, [selectedServiceId, statusFilter, gradeFilter])

  function loadTasks() {
    setLoading(true)
    const params = new URLSearchParams({ serviceId: selectedServiceId })
    if (statusFilter) params.set('status', statusFilter)
    if (gradeFilter) params.set('grade', gradeFilter)

    fetch(`/api/tasks?${params}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setTasks(data.data)
      })
      .finally(() => setLoading(false))
  }

  async function handleRetry(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RETRY_PENDING' }),
    })
    loadTasks()
  }

  const gradeGroups = {
    A: tasks.filter(t => t.automationGrade === 'A'),
    B: tasks.filter(t => t.automationGrade === 'B'),
    C: tasks.filter(t => t.automationGrade === 'C'),
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">작업 센터</h2>
        <p className="text-muted-foreground">모든 마케팅 작업을 관리합니다</p>
      </div>

      <div className="flex flex-wrap gap-4">
        {services.length > 0 && (
          <Select
            value={selectedServiceId}
            onChange={e => setSelectedServiceId(e.target.value)}
            className="w-48"
          >
            {services.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        )}
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="w-40"
        >
          <option value="">전체 상태</option>
          {Object.entries(TaskStatusLabel).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
        <Select
          value={gradeFilter}
          onChange={e => setGradeFilter(e.target.value)}
          className="w-40"
        >
          <option value="">전체 등급</option>
          {Object.entries(AutomationGradeLabel).map(([value, label]) => (
            <option key={value} value={value}>{value} - {label}</option>
          ))}
        </Select>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center">
            <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">작업이 없습니다</h3>
            <p className="text-muted-foreground">서비스를 등록하고 채널을 연결하면 작업이 자동 생성됩니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 등급별 구분 표시 */}
          {(!gradeFilter) && Object.entries(gradeGroups).map(([grade, items]) => {
            if (items.length === 0) return null
            return (
              <div key={grade} className="space-y-3">
                <div className="flex items-center gap-2">
                  <AutomationGradeBadge grade={grade as AutomationGrade} showDescription />
                  <Badge variant="outline">{items.length}건</Badge>
                </div>
                {items.map(task => (
                  <TaskCard key={task.id} task={task} onRetry={handleRetry} />
                ))}
              </div>
            )
          })}

          {gradeFilter && tasks.map(task => (
            <TaskCard key={task.id} task={task} onRetry={handleRetry} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, onRetry }: { task: any; onRetry: (id: string) => void }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{task.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {TaskTypeLabel[task.type as keyof typeof TaskTypeLabel] || task.type}
              </Badge>
              {task.channelConnection?.channel && (
                <span className="text-xs text-muted-foreground">
                  {task.channelConnection.channel.displayName}
                </span>
              )}
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground">{task.description}</p>
            )}
            {task.errorReason && (
              <p className="text-sm text-red-600">실패 사유: {task.errorReason}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <AutomationGradeBadge grade={task.automationGrade as AutomationGrade} />
            <StatusBadge status={task.status} type="task" />
            {task.status === 'FAILED' && (
              <Button size="sm" variant="outline" onClick={() => onRetry(task.id)}>
                <RefreshCw className="h-3 w-3 mr-1" />
                재시도
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
