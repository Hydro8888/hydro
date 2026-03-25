'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/common/status-badge'
import { AutomationGradeBadge } from '@/components/common/automation-grade-badge'
import { RiskLevelBadge } from '@/components/common/risk-level-badge'
import type { AutomationGrade } from '@/lib/constants/enums'
import { CheckSquare, Clock } from 'lucide-react'
import { apiUrl } from '@/lib/api'

const STATUS_TABS = [
  { value: '', label: '전체' },
  { value: 'REVIEW_PENDING', label: '검토 대기' },
  { value: 'REVIEWING', label: '검토 중' },
  { value: 'APPROVED', label: '승인' },
  { value: 'REVISION_REQUESTED', label: '수정 요청' },
  { value: 'REJECTED', label: '반려' },
]

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    fetch(apiUrl(`/api/approvals?${params}`))
      .then(res => res.json())
      .then(data => { if (data.success) setApprovals(data.data) })
      .finally(() => setLoading(false))
  }, [statusFilter])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">승인 센터</h2>
        <p className="text-muted-foreground">승인이 필요한 작업을 검토하고 처리합니다</p>
      </div>

      {/* 상태 탭 */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(tab => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
            {tab.value === 'REVIEW_PENDING' && approvals.filter(a => a.status === 'REVIEW_PENDING').length > 0 && statusFilter !== 'REVIEW_PENDING' && (
              <span className="ml-1 bg-yellow-500 text-white rounded-full h-5 w-5 inline-flex items-center justify-center text-xs">
                {approvals.filter(a => a.status === 'REVIEW_PENDING').length}
              </span>
            )}
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
      ) : approvals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">승인 대기 항목이 없습니다</h3>
            <p className="text-muted-foreground">B등급 작업이 생성되면 여기에 승인 요청이 표시됩니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval: any) => (
            <Link key={approval.id} href={`/approvals/${approval.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{approval.task.title}</span>
                        <AutomationGradeBadge grade={approval.task.automationGrade as AutomationGrade} />
                      </div>
                      {approval.task.channelConnection?.channel && (
                        <p className="text-sm text-muted-foreground">
                          채널: {approval.task.channelConnection.channel.displayName}
                        </p>
                      )}
                      {approval.reason && (
                        <p className="text-sm text-muted-foreground">{approval.reason}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(approval.createdAt).toLocaleString('ko-KR')}
                        {approval.reviewer && (
                          <span>| 검토자: {approval.reviewer.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskLevelBadge level={approval.riskLevel} />
                      <StatusBadge status={approval.status} type="approval" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
