'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/common/status-badge'
import { AutomationGradeBadge } from '@/components/common/automation-grade-badge'
import { RiskLevelBadge } from '@/components/common/risk-level-badge'
import { DiffViewer } from '@/components/common/diff-viewer'
import type { AutomationGrade } from '@/lib/constants/enums'
import { ArrowLeft, Loader2, CheckCircle, XCircle, Edit3, Eye } from 'lucide-react'

export default function ApprovalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [approval, setApproval] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetch(`/api/approvals/${params.id}`)
        .then(res => res.json())
        .then(data => { if (data.success) setApproval(data.data) })
        .finally(() => setLoading(false))
    }
  }, [params.id])

  async function handleAction(action: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/approvals/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setApproval(data.data)
        setShowRejectInput(false)
        setRejectionReason('')
        // 상세 다시 로드
        const detail = await fetch(`/api/approvals/${params.id}`).then(r => r.json())
        if (detail.success) setApproval(detail.data)
      }
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

  if (!approval) return <p>승인 요청을 찾을 수 없습니다.</p>

  const canReview = approval.status === 'REVIEW_PENDING'
  const canDecide = approval.status === 'REVIEWING'
  const isFinished = ['APPROVED', 'REJECTED'].includes(approval.status)

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => router.push('/approvals')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        승인 센터로 돌아가기
      </Button>

      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{approval.task.title}</h2>
          <div className="flex items-center gap-2">
            <AutomationGradeBadge grade={approval.task.automationGrade as AutomationGrade} />
            <StatusBadge status={approval.status} type="approval" />
            <RiskLevelBadge level={approval.riskLevel} />
          </div>
        </div>
      </div>

      {/* 작업 정보 */}
      <Card>
        <CardHeader><CardTitle className="text-lg">작업 정보</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {approval.task.channelConnection?.channel && (
            <p><span className="font-medium">채널:</span> {approval.task.channelConnection.channel.displayName}</p>
          )}
          <p><span className="font-medium">서비스:</span> {approval.task.service?.name}</p>
          {approval.task.description && (
            <p><span className="font-medium">설명:</span> {approval.task.description}</p>
          )}
          {approval.reason && (
            <p><span className="font-medium">변경 이유:</span> {approval.reason}</p>
          )}
        </CardContent>
      </Card>

      {/* 변경 전/후 비교 */}
      <DiffViewer
        before={approval.previousContent}
        after={approval.draftContent}
        title="변경 내용 비교"
      />

      {/* 반려 사유 (있으면) */}
      {approval.rejectionReason && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-red-600">반려 사유</p>
            <p className="text-sm mt-1">{approval.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* 승인 내용 (있으면) */}
      {approval.approvedContent && (
        <Card className="border-green-200">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-green-600">승인된 내용</p>
            <pre className="text-sm mt-1 whitespace-pre-wrap bg-green-50 p-3 rounded">
              {JSON.stringify(approval.approvedContent, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼 */}
      {!isFinished && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {canReview && (
              <Button onClick={() => handleAction('start_review')} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                검토 시작
              </Button>
            )}

            {canDecide && (
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  승인
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction('request_revision')}
                  disabled={actionLoading}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  수정 요청
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (!showRejectInput) {
                      setShowRejectInput(true)
                    } else {
                      handleAction('reject')
                    }
                  }}
                  disabled={actionLoading || (showRejectInput && !rejectionReason)}
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                  반려
                </Button>
              </div>
            )}

            {showRejectInput && (
              <Textarea
                label="반려 사유 *"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="반려 사유를 입력해주세요"
                rows={3}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
