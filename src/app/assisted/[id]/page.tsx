'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/common/status-badge'
import { AutomationGradeBadge } from '@/components/common/automation-grade-badge'
import { Checklist } from '@/components/common/checklist'
import { MOCK_USERS } from '@/lib/auth'
import { ArrowLeft, Loader2, Plus, CheckCircle, XCircle } from 'lucide-react'

export default function AssistedTaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [assisted, setAssisted] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('')

  function loadData() {
    if (params.id) {
      fetch(`/api/assisted-tasks/${params.id}`)
        .then(res => res.json())
        .then(data => { if (data.success) setAssisted(data.data) })
        .finally(() => setLoading(false))
    }
  }

  useEffect(() => { loadData() }, [params.id])

  async function updateAssisted(body: any) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/assisted-tasks/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) setAssisted(data.data)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAssign(assigneeId: string) {
    await updateAssisted({ assigneeId, status: 'ASSIGNED' })
  }

  async function handleChecklistChange(items: any[]) {
    await updateAssisted({ checklist: items })
  }

  async function addEvidence() {
    if (!newEvidenceUrl) return
    const currentUrls = (assisted.evidenceUrls as string[]) || []
    await updateAssisted({ evidenceUrls: [...currentUrls, newEvidenceUrl] })
    setNewEvidenceUrl('')
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-60 bg-muted rounded" />
    </div>
  }

  if (!assisted) return <p>반자동 작업을 찾을 수 없습니다.</p>

  const checklist = (assisted.checklist as any[]) || []
  const evidenceUrls = (assisted.evidenceUrls as string[]) || []
  const isFinished = assisted.status === 'COMPLETED'

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => router.push('/assisted')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        반자동 작업 센터로 돌아가기
      </Button>

      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{assisted.task.title}</h2>
          <div className="flex items-center gap-2">
            <AutomationGradeBadge grade="C" showDescription />
            <StatusBadge status={assisted.status} type="assisted" />
          </div>
        </div>
      </div>

      {/* 작업 지침 */}
      <Card>
        <CardHeader><CardTitle className="text-lg">작업 지침</CardTitle></CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
            {assisted.instructions}
          </pre>
        </CardContent>
      </Card>

      {/* 담당자 배정 */}
      <Card>
        <CardHeader><CardTitle className="text-lg">담당자</CardTitle></CardHeader>
        <CardContent>
          {assisted.assignee ? (
            <p className="text-sm">배정됨: <strong>{assisted.assignee.name}</strong> ({assisted.assignee.email})</p>
          ) : (
            <div className="flex gap-3 items-end">
              <Select label="담당자 선택" className="flex-1" onChange={e => {
                if (e.target.value) handleAssign(e.target.value)
              }}>
                <option value="">담당자를 선택하세요</option>
                {MOCK_USERS.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 체크리스트 */}
      {checklist.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <Checklist
              items={checklist}
              onChange={handleChecklistChange}
              disabled={isFinished}
            />
          </CardContent>
        </Card>
      )}

      {/* 증빙 자료 */}
      <Card>
        <CardHeader><CardTitle className="text-lg">증빙 자료</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {evidenceUrls.length > 0 ? (
            <ul className="space-y-2">
              {evidenceUrls.map((url, i) => (
                <li key={i} className="flex items-center gap-2 text-sm rounded-lg border p-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="truncate">{url}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">아직 제출된 증빙이 없습니다.</p>
          )}

          {!isFinished && (
            <div className="flex gap-2">
              <Input
                value={newEvidenceUrl}
                onChange={e => setNewEvidenceUrl(e.target.value)}
                placeholder="증빙 URL을 입력하세요"
                className="flex-1"
              />
              <Button onClick={addEvidence} disabled={!newEvidenceUrl || actionLoading} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                추가
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상태 전환 버튼 */}
      {!isFinished && (
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3">
            {assisted.status === 'ASSIGNED' && (
              <Button onClick={() => updateAssisted({ status: 'IN_PROGRESS' })} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                작업 시작
              </Button>
            )}
            {assisted.status === 'IN_PROGRESS' && (
              <>
                <Button onClick={() => updateAssisted({ status: 'EVIDENCE_PENDING' })} disabled={actionLoading}>
                  증빙 제출
                </Button>
                <Button variant="outline" onClick={() => updateAssisted({ status: 'COMPLETED' })} disabled={actionLoading}>
                  바로 완료 처리
                </Button>
              </>
            )}
            {assisted.status === 'EVIDENCE_PENDING' && (
              <Button onClick={() => updateAssisted({ status: 'REVIEW_PENDING' })} disabled={actionLoading}>
                검수 요청
              </Button>
            )}
            {assisted.status === 'REVIEW_PENDING' && (
              <>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => updateAssisted({ status: 'COMPLETED' })}
                  disabled={actionLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  검수 완료
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updateAssisted({ status: 'REJECTED' })}
                  disabled={actionLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  반려
                </Button>
              </>
            )}
            {assisted.status === 'REJECTED' && (
              <Button onClick={() => updateAssisted({ status: 'IN_PROGRESS' })} disabled={actionLoading}>
                재작업
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
