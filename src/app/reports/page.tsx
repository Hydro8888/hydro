'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Clock, AlertTriangle, Lightbulb } from 'lucide-react'
import { apiUrl } from '@/lib/api'

type Tab = 'daily' | 'weekly' | 'monthly'

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('daily')
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(apiUrl(`/api/reports/${tab}`))
      .then(res => res.json())
      .then(d => { if (d.success) setReport(d.data) })
      .finally(() => setLoading(false))
  }, [tab])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">보고서 센터</h2>
        <p className="text-muted-foreground">운영 보고서를 생성하고 확인합니다</p>
      </div>

      <div className="flex gap-2">
        {([['daily', '일간'], ['weekly', '주간'], ['monthly', '월간']] as const).map(([key, label]) => (
          <Button key={key} variant={tab === key ? 'default' : 'outline'} onClick={() => setTab(key)}>
            {label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-24 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      ) : !report ? (
        <Card><CardContent className="p-12 text-center"><BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><p>보고서 데이터가 없습니다.</p></CardContent></Card>
      ) : (
        <>
          {/* 일간 보고 */}
          {tab === 'daily' && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">{report.date} 일간 보고</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">생성된 작업</p>
                      <p className="text-3xl font-bold">{report.tasksCreated}</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">완료된 작업</p>
                      <p className="text-3xl font-bold text-green-600">{report.tasksCompleted}</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">실패한 작업</p>
                      <p className="text-3xl font-bold text-red-600">{report.tasksFailed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="p-6 flex items-center gap-4">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">승인 대기</p>
                      <p className="text-2xl font-bold">{report.approvalsPending}건</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center gap-4">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">오늘 승인 처리</p>
                      <p className="text-2xl font-bold">{report.approvalsProcessed}건</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {report.urgentIssues?.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader><CardTitle className="text-lg text-red-600">긴급 이슈</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {report.urgentIssues.map((issue: string, i: number) => (
                        <li key={i} className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-red-500" />{issue}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* 주간 보고 */}
          {tab === 'weekly' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">주간 보고</CardTitle>
                  <CardDescription>{report.weekStart} ~ {report.weekEnd}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">자동화율</p>
                      <p className="text-2xl font-bold">{report.automationRate}%</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">완료</p>
                      <p className="text-2xl font-bold text-green-600">{report.totalCompleted}</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">실패</p>
                      <p className="text-2xl font-bold text-red-600">{report.totalFailed}</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">승인 평균</p>
                      <p className="text-2xl font-bold">{report.avgApprovalHours ?? '-'}h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {report.channelStats?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">채널별 현황</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.channelStats.map((ch: any) => (
                        <div key={ch.channelName} className="flex items-center justify-between rounded-lg border p-3">
                          <span className="font-medium text-sm">{ch.channelName}</span>
                          <div className="flex gap-2">
                            <Badge variant="success">{ch.completed} 완료</Badge>
                            {ch.failed > 0 && <Badge variant="destructive">{ch.failed} 실패</Badge>}
                            <Badge variant="outline">{ch.total} 전체</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {report.nextWeekPriorities?.length > 0 && (
                <Card className="border-blue-200">
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="h-5 w-5 text-blue-600" />다음 주 우선 과제</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {report.nextWeekPriorities.map((p: string, i: number) => (
                        <li key={i} className="text-sm flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />{p}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* 월간 보고 */}
          {tab === 'monthly' && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">{report.month} 월간 보고</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">전체 작업</p>
                      <p className="text-2xl font-bold">{report.totalTasks}</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">완료</p>
                      <p className="text-2xl font-bold text-green-600">{report.completedTasks}</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">실패</p>
                      <p className="text-2xl font-bold text-red-600">{report.failedTasks}</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                      <p className="text-sm text-muted-foreground">자동화율</p>
                      <p className="text-2xl font-bold">{report.automationRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 등급 분포 */}
              <Card>
                <CardHeader><CardTitle className="text-lg">자동화 등급 분포</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.gradeDistribution?.map((g: any) => {
                      const colors: Record<string, string> = { A: 'bg-green-500', B: 'bg-yellow-500', C: 'bg-blue-500' }
                      return (
                        <div key={g.grade} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{g.grade} ({g.grade === 'A' ? 'Autopilot' : g.grade === 'B' ? 'Approval' : 'Assisted'})</span>
                            <span>{g.count}건 ({g.percentage}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className={`h-2 rounded-full ${colors[g.grade]}`} style={{ width: `${g.percentage}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* 승인/반자동 지표 */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-lg">승인 지표</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>전체: {report.approvalMetrics?.total}건</p>
                    <p>승인: {report.approvalMetrics?.approved}건</p>
                    <p>반려: {report.approvalMetrics?.rejected}건</p>
                    <p>평균 처리: {report.approvalMetrics?.avgHours ?? '-'}시간</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">반자동 지표</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>전체: {report.assistedMetrics?.total}건</p>
                    <p>완료: {report.assistedMetrics?.completed}건</p>
                    <p>평균 소요: {report.assistedMetrics?.avgDays ?? '-'}일</p>
                  </CardContent>
                </Card>
              </div>

              {/* 추천 */}
              {report.recommendations?.length > 0 && (
                <Card className="border-green-200">
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Lightbulb className="h-5 w-5 text-green-600" />전략적 개선 제안</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.recommendations.map((r: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />{r}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
