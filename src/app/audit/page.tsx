'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DiffViewer } from '@/components/common/diff-viewer'
import { History, ChevronDown, ChevronRight, Bot, User } from 'lucide-react'
import { apiUrl } from '@/lib/api'

const ENTITY_TYPES = ['', 'Service', 'Task', 'ApprovalRequest', 'AssistedTask']
const ACTIONS = ['', 'CREATE', 'UPDATE', 'STATUS_CHANGE', 'GENERATE', 'EXECUTE_SUCCESS', 'EXECUTE_FAILED', 'RETRY', 'START_REVIEW', 'APPROVE', 'REQUEST_REVISION', 'REJECT']

const actionLabels: Record<string, string> = {
  CREATE: '생성',
  UPDATE: '수정',
  STATUS_CHANGE: '상태 변경',
  GENERATE: '자동 생성',
  EXECUTE_SUCCESS: '실행 성공',
  EXECUTE_FAILED: '실행 실패',
  RETRY: '재시도',
  START_REVIEW: '검토 시작',
  APPROVE: '승인',
  REQUEST_REVISION: '수정 요청',
  REJECT: '반려',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 필터
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  function loadLogs() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (entityType) params.set('entityType', entityType)
    if (action) params.set('action', action)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)

    fetch(apiUrl(`/api/audit?${params}`))
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setLogs(d.data.logs)
          setTotal(d.data.total)
          setTotalPages(d.data.totalPages)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadLogs() }, [page, entityType, action, dateFrom, dateTo])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">감사 이력</h2>
        <p className="text-muted-foreground">모든 변경 이력과 실행 로그를 확인합니다</p>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Select value={entityType} onChange={e => { setEntityType(e.target.value); setPage(1) }} className="w-40">
              <option value="">전체 유형</option>
              {ENTITY_TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select value={action} onChange={e => { setAction(e.target.value); setPage(1) }} className="w-40">
              <option value="">전체 액션</option>
              {ACTIONS.filter(Boolean).map(a => <option key={a} value={a}>{actionLabels[a] || a}</option>)}
            </Select>
            <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="w-40" placeholder="시작일" />
            <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="w-40" placeholder="종료일" />
            <span className="flex items-center text-sm text-muted-foreground">총 {total}건</span>
          </div>
        </CardContent>
      </Card>

      {/* 이력 목록 */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-12 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">이력이 없습니다</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => {
            const isExpanded = expandedId === log.id
            const isAuto = !log.userId

            return (
              <Card key={log.id}>
                <CardContent className="p-0">
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{log.entityType}</Badge>
                        <Badge variant={log.action.includes('FAIL') || log.action === 'REJECT' ? 'destructive' : 'secondary'}>
                          {actionLabels[log.action] || log.action}
                        </Badge>
                        {isAuto ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Bot className="h-3 w-3" />자동</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><User className="h-3 w-3" />{log.user?.name || '알 수 없음'}</span>
                        )}
                      </div>
                    </div>

                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(log.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </button>

                  {isExpanded && (log.before || log.after) && (
                    <div className="border-t p-4">
                      <DiffViewer before={log.before} after={log.after} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>이전</Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>다음</Button>
        </div>
      )}
    </div>
  )
}
