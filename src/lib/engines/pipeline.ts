import { prisma } from '../db'
import type { PipelineStage, PipelineActivity, PipelineStatus } from '@/types'

export async function getPipelineStatus(serviceIds: string[]): Promise<PipelineStatus> {
  if (serviceIds.length === 0) {
    return {
      stages: getEmptyStages(),
      bottleneck: null,
      recentActivity: [],
      summary: { totalChannels: 0, totalTasks: 0, completionRate: 0, automationRate: 0 },
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 모든 데이터를 병렬로 조회
  const [
    allChannels,
    connections,
    tasks,
    approvals,
    assistedTasks,
    recentLogs,
  ] = await Promise.all([
    prisma.channel.findMany({ where: { isActive: true } }),
    prisma.channelConnection.findMany({
      where: { serviceId: { in: serviceIds } },
      include: { channel: true },
    }),
    prisma.task.findMany({
      where: { serviceId: { in: serviceIds } },
      select: {
        id: true, status: true, automationGrade: true,
        completedAt: true, createdAt: true, updatedAt: true,
      },
    }),
    prisma.approvalRequest.findMany({
      where: { task: { serviceId: { in: serviceIds } } },
      select: { id: true, status: true, createdAt: true, reviewedAt: true },
    }),
    prisma.assistedTask.findMany({
      where: { task: { serviceId: { in: serviceIds } } },
      select: { id: true, status: true, assigneeId: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: { id: true, entityType: true, entityId: true, action: true, createdAt: true, after: true },
    }),
  ])

  // ===== Stage 1: 채널 탐색 =====
  const connectedChannelIds = new Set(connections.map(c => c.channelId))
  const readyNow = allChannels.filter(ch => connectedChannelIds.has(ch.id)).length
  const stage1: PipelineStage = {
    stage: 1,
    title: '채널 탐색',
    icon: 'Search',
    health: 'healthy',
    primaryMetric: allChannels.length,
    primaryLabel: '사용 가능 채널',
    details: {
      total: allChannels.length,
      connected: readyNow,
      available: allChannels.length - readyNow,
    },
    actionUrl: '/channels',
  }

  // ===== Stage 2: 채널 연결 =====
  const connStatusMap: Record<string, number> = {}
  connections.forEach(c => { connStatusMap[c.status] = (connStatusMap[c.status] || 0) + 1 })
  const connConnected = connStatusMap['CONNECTED'] || 0
  const connFailed = (connStatusMap['FAILED'] || 0) +
    (connStatusMap['INSUFFICIENT_PERMISSIONS'] || 0) +
    (connStatusMap['REAUTH_REQUIRED'] || 0)
  const stage2Health = connFailed > 0 ? 'critical' as const : connections.length === 0 ? 'warning' as const : 'healthy' as const
  const stage2: PipelineStage = {
    stage: 2,
    title: '채널 연결',
    icon: 'Link2',
    health: stage2Health,
    primaryMetric: connConnected,
    primaryLabel: '연결됨',
    details: {
      connected: connConnected,
      failed: connFailed,
      total: connections.length,
    },
    actionUrl: '/channels/connections',
  }

  // ===== Stage 3: 작업 생성 =====
  const gradeA = tasks.filter(t => t.automationGrade === 'A').length
  const gradeB = tasks.filter(t => t.automationGrade === 'B').length
  const gradeC = tasks.filter(t => t.automationGrade === 'C').length
  const createdToday = tasks.filter(t => t.createdAt >= today).length
  const stage3: PipelineStage = {
    stage: 3,
    title: '작업 생성',
    icon: 'Layers',
    health: tasks.length === 0 ? 'warning' : 'healthy',
    primaryMetric: tasks.length,
    primaryLabel: '전체 작업',
    details: {
      gradeA,
      gradeB,
      gradeC,
      createdToday,
    },
    actionUrl: '/tasks',
  }

  // ===== Stage 4: 승인 흐름 (B등급) =====
  const approvalPending = approvals.filter(a => a.status === 'REVIEW_PENDING').length
  const approvalReviewing = approvals.filter(a => a.status === 'REVIEWING').length
  const approvalApproved = approvals.filter(a => a.status === 'APPROVED').length
  const approvalRejected = approvals.filter(a => a.status === 'REJECTED').length
  const approvalExpired = approvals.filter(a => a.status === 'EXPIRED').length
  // 평균 대기시간 계산
  const processedApprovals = approvals.filter(a => a.reviewedAt)
  let avgWaitHours = 0
  if (processedApprovals.length > 0) {
    const totalHours = processedApprovals.reduce((sum, a) => {
      return sum + (a.reviewedAt!.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60)
    }, 0)
    avgWaitHours = Math.round(totalHours / processedApprovals.length * 10) / 10
  }
  const stage4Health = approvalPending > 10 ? 'critical' as const
    : approvalPending > 5 ? 'warning' as const : 'healthy' as const
  const stage4: PipelineStage = {
    stage: 4,
    title: '승인 흐름',
    icon: 'CheckSquare',
    health: stage4Health,
    primaryMetric: approvalPending,
    primaryLabel: '대기 중',
    details: {
      pending: approvalPending,
      reviewing: approvalReviewing,
      approved: approvalApproved,
      rejected: approvalRejected,
      expired: approvalExpired,
      avgWaitHours,
    },
    actionUrl: '/approvals',
  }

  // ===== Stage 5: 반자동 작업 (C등급) =====
  const assistedCreated = assistedTasks.filter(a => a.status === 'CREATED').length
  const assistedAssigned = assistedTasks.filter(a => a.status === 'ASSIGNED').length
  const assistedInProgress = assistedTasks.filter(a => a.status === 'IN_PROGRESS' || a.status === 'EVIDENCE_PENDING' || a.status === 'REVIEW_PENDING').length
  const assistedCompleted = assistedTasks.filter(a => a.status === 'COMPLETED').length
  const assistedUnassigned = assistedTasks.filter(a => !a.assigneeId && a.status === 'CREATED').length
  const activeCGrade = assistedTasks.length - assistedCompleted
  const stage5Health = assistedUnassigned > 3 ? 'critical' as const
    : assistedUnassigned > 0 ? 'warning' as const : 'healthy' as const
  const stage5: PipelineStage = {
    stage: 5,
    title: '반자동 작업',
    icon: 'UserCheck',
    health: stage5Health,
    primaryMetric: activeCGrade,
    primaryLabel: '진행 중',
    details: {
      created: assistedCreated,
      assigned: assistedAssigned,
      inProgress: assistedInProgress,
      completed: assistedCompleted,
      unassigned: assistedUnassigned,
    },
    actionUrl: '/assisted',
  }

  // ===== Stage 6: 자동 실행 (A등급) =====
  const aGradeTasks = tasks.filter(t => t.automationGrade === 'A')
  const running = tasks.filter(t => t.status === 'RUNNING').length
  const completedToday = aGradeTasks.filter(t => t.status === 'COMPLETED' && t.completedAt && t.completedAt >= today).length
  const failedToday = aGradeTasks.filter(t => t.status === 'FAILED' && t.updatedAt >= today).length
  const aTotal = aGradeTasks.length || 1
  const aCompleted = aGradeTasks.filter(t => t.status === 'COMPLETED').length
  const aFailed = aGradeTasks.filter(t => t.status === 'FAILED').length
  const successRate = aGradeTasks.length > 0 ? Math.round(aCompleted / (aCompleted + aFailed || 1) * 100) : 0
  const stage6Health = successRate < 50 && aGradeTasks.length > 0 ? 'critical' as const
    : successRate < 80 && aGradeTasks.length > 0 ? 'warning' as const : 'healthy' as const
  const stage6: PipelineStage = {
    stage: 6,
    title: '자동 실행',
    icon: 'Zap',
    health: stage6Health,
    primaryMetric: completedToday,
    primaryLabel: '오늘 완료',
    details: {
      running,
      completedToday,
      failedToday,
      successRate,
    },
    actionUrl: '/operations',
  }

  // ===== Stage 7: 결과 =====
  const totalCompleted = tasks.filter(t => t.status === 'COMPLETED').length
  const totalFailed = tasks.filter(t => t.status === 'FAILED').length
  const totalAll = tasks.length || 1
  const completionRate = Math.round(totalCompleted / totalAll * 100)
  const byGradeACompleted = aGradeTasks.filter(t => t.status === 'COMPLETED').length
  const byGradeBCompleted = tasks.filter(t => t.automationGrade === 'B' && t.status === 'COMPLETED').length
  const byGradeCCompleted = tasks.filter(t => t.automationGrade === 'C' && t.status === 'COMPLETED').length
  const stage7Health = completionRate > 70 ? 'healthy' as const
    : completionRate > 40 ? 'warning' as const : tasks.length === 0 ? 'healthy' as const : 'critical' as const
  const stage7: PipelineStage = {
    stage: 7,
    title: '결과',
    icon: 'Target',
    health: stage7Health,
    primaryMetric: completionRate,
    primaryLabel: '완료율 %',
    details: {
      completed: totalCompleted,
      failed: totalFailed,
      total: tasks.length,
      byGradeA: byGradeACompleted,
      byGradeB: byGradeBCompleted,
      byGradeC: byGradeCCompleted,
    },
    actionUrl: '/reports',
  }

  const stages = [stage1, stage2, stage3, stage4, stage5, stage6, stage7]

  // ===== 병목 감지 =====
  const bottleneck = detectBottleneck(stages)

  // ===== 최근 활동 =====
  const recentActivity: PipelineActivity[] = recentLogs.map(log => ({
    id: log.id,
    timestamp: log.createdAt.toISOString(),
    entityType: log.entityType,
    action: log.action,
    description: formatActivityDescription(log.entityType, log.action, log.after as any),
  }))

  // ===== 요약 =====
  const automationRate = tasks.length > 0 ? Math.round(gradeA / tasks.length * 100) : 0

  return {
    stages,
    bottleneck,
    recentActivity,
    summary: {
      totalChannels: connConnected,
      totalTasks: tasks.length,
      completionRate,
      automationRate,
    },
  }
}

function detectBottleneck(stages: PipelineStage[]): PipelineStatus['bottleneck'] {
  // critical 단계 우선
  const critical = stages.filter(s => s.health === 'critical')
  if (critical.length > 0) {
    const worst = critical[0]
    return {
      stage: worst.stage,
      title: worst.title,
      reason: getBottleneckReason(worst),
    }
  }

  // warning 단계
  const warnings = stages.filter(s => s.health === 'warning')
  if (warnings.length > 0) {
    const worst = warnings[0]
    return {
      stage: worst.stage,
      title: worst.title,
      reason: getBottleneckReason(worst),
    }
  }

  return null
}

function getBottleneckReason(stage: PipelineStage): string {
  switch (stage.stage) {
    case 2: return `채널 연결 실패 ${stage.details.failed}건 - 즉시 확인이 필요합니다`
    case 3: return '아직 생성된 작업이 없습니다 - 채널을 연결하세요'
    case 4: return `승인 대기 ${stage.details.pending}건 - 검수자 배정을 확인하세요`
    case 5: return `미할당 작업 ${stage.details.unassigned}건 - 담당자를 배정하세요`
    case 6: return `성공률 ${stage.details.successRate}% - 실패 원인을 분석하세요`
    case 7: return `완료율 ${stage.primaryMetric}% - 전반적인 개선이 필요합니다`
    default: return '확인이 필요합니다'
  }
}

function formatActivityDescription(entityType: string, action: string, after: any): string {
  const actionLabels: Record<string, string> = {
    GENERATE: '작업 생성',
    CONNECT: '채널 연결',
    STATUS_CHANGE: '상태 변경',
    EXECUTE_SUCCESS: '실행 성공',
    EXECUTE_FAILED: '실행 실패',
    APPROVE: '승인 완료',
    REJECT: '승인 반려',
    START_REVIEW: '검토 시작',
    REQUEST_REVISION: '수정 요청',
    RETRY: '재시도',
    UPDATE: '업데이트',
    CREATE: '생성',
    DELETE: '삭제',
  }

  const entityLabels: Record<string, string> = {
    Task: '작업',
    ApprovalRequest: '승인',
    AssistedTask: '반자동 작업',
    ChannelConnection: '채널',
    Service: '서비스',
    Asset: '자산',
  }

  const actionLabel = actionLabels[action] || action
  const entityLabel = entityLabels[entityType] || entityType
  const status = after?.status ? ` → ${after.status}` : ''

  return `${entityLabel} ${actionLabel}${status}`
}

function getEmptyStages(): PipelineStage[] {
  return [
    { stage: 1, title: '채널 탐색', icon: 'Search', health: 'healthy', primaryMetric: 0, primaryLabel: '사용 가능 채널', details: {}, actionUrl: '/channels' },
    { stage: 2, title: '채널 연결', icon: 'Link2', health: 'warning', primaryMetric: 0, primaryLabel: '연결됨', details: {}, actionUrl: '/channels/connections' },
    { stage: 3, title: '작업 생성', icon: 'Layers', health: 'warning', primaryMetric: 0, primaryLabel: '전체 작업', details: {}, actionUrl: '/tasks' },
    { stage: 4, title: '승인 흐름', icon: 'CheckSquare', health: 'healthy', primaryMetric: 0, primaryLabel: '대기 중', details: {}, actionUrl: '/approvals' },
    { stage: 5, title: '반자동 작업', icon: 'UserCheck', health: 'healthy', primaryMetric: 0, primaryLabel: '진행 중', details: {}, actionUrl: '/assisted' },
    { stage: 6, title: '자동 실행', icon: 'Zap', health: 'healthy', primaryMetric: 0, primaryLabel: '오늘 완료', details: {}, actionUrl: '/operations' },
    { stage: 7, title: '결과', icon: 'Target', health: 'healthy', primaryMetric: 0, primaryLabel: '완료율 %', details: {}, actionUrl: '/reports' },
  ]
}
