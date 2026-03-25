import { prisma } from '../db'
import { getCurrentUser } from '../auth'

interface OperationalMetrics {
  channelStatus: { status: string; count: number }[]
  taskDistribution: { status: string; count: number }[]
  gradeDistribution: { grade: string; count: number }[]
  automationRate: number
  failureRate: number
  avgApprovalHours: number | null
  assistedCompletionRate: number
  recentFailures: any[]
  approvalBottlenecks: any[]
  unassignedAssisted: number
}

interface Alert {
  id: string
  type: string
  priority: 'URGENT' | 'IMPORTANT' | 'NORMAL'
  title: string
  message: string
  entityId?: string
  createdAt: Date
}

export async function getOperationalMetrics(serviceIds: string[]): Promise<OperationalMetrics> {
  if (serviceIds.length === 0) {
    return {
      channelStatus: [], taskDistribution: [], gradeDistribution: [],
      automationRate: 0, failureRate: 0, avgApprovalHours: null,
      assistedCompletionRate: 0, recentFailures: [], approvalBottlenecks: [],
      unassignedAssisted: 0,
    }
  }

  // 채널 상태 분포
  const channelConnections = await prisma.channelConnection.findMany({
    where: { serviceId: { in: serviceIds } },
    select: { status: true },
  })
  const channelStatusMap: Record<string, number> = {}
  channelConnections.forEach(c => {
    channelStatusMap[c.status] = (channelStatusMap[c.status] || 0) + 1
  })
  const channelStatus = Object.entries(channelStatusMap).map(([status, count]) => ({ status, count }))

  // 작업 상태 분포
  const tasks = await prisma.task.findMany({
    where: { serviceId: { in: serviceIds } },
    select: { status: true, automationGrade: true },
  })
  const taskStatusMap: Record<string, number> = {}
  const gradeMap: Record<string, number> = {}
  let completedCount = 0
  let failedCount = 0
  tasks.forEach(t => {
    taskStatusMap[t.status] = (taskStatusMap[t.status] || 0) + 1
    gradeMap[t.automationGrade] = (gradeMap[t.automationGrade] || 0) + 1
    if (t.status === 'COMPLETED') completedCount++
    if (t.status === 'FAILED') failedCount++
  })
  const taskDistribution = Object.entries(taskStatusMap).map(([status, count]) => ({ status, count }))
  const gradeDistribution = Object.entries(gradeMap).map(([grade, count]) => ({ grade, count }))

  const total = tasks.length || 1
  const automationRate = Math.round((gradeMap['A'] || 0) / total * 100)
  const failureRate = Math.round(failedCount / total * 100)

  // 승인 처리 속도 (평균 시간)
  const approvedRequests = await prisma.approvalRequest.findMany({
    where: {
      task: { serviceId: { in: serviceIds } },
      status: 'APPROVED',
      reviewedAt: { not: null },
    },
    select: { createdAt: true, reviewedAt: true },
  })
  let avgApprovalHours: number | null = null
  if (approvedRequests.length > 0) {
    const totalHours = approvedRequests.reduce((sum, a) => {
      const diff = (a.reviewedAt!.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60)
      return sum + diff
    }, 0)
    avgApprovalHours = Math.round(totalHours / approvedRequests.length * 10) / 10
  }

  // 반자동 작업 완료율
  const assistedTasks = await prisma.assistedTask.findMany({
    where: { task: { serviceId: { in: serviceIds } } },
    select: { status: true },
  })
  const assistedTotal = assistedTasks.length || 1
  const assistedCompleted = assistedTasks.filter(a => a.status === 'COMPLETED').length
  const assistedCompletionRate = Math.round(assistedCompleted / assistedTotal * 100)

  // 최근 24시간 실패 작업
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const recentFailures = await prisma.task.findMany({
    where: {
      serviceId: { in: serviceIds },
      status: 'FAILED',
      updatedAt: { gte: yesterday },
    },
    include: { channelConnection: { include: { channel: true } } },
    take: 10,
    orderBy: { updatedAt: 'desc' },
  })

  // 승인 병목 (3일 이상 대기)
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const approvalBottlenecks = await prisma.approvalRequest.findMany({
    where: {
      task: { serviceId: { in: serviceIds } },
      status: 'REVIEW_PENDING',
      createdAt: { lt: threeDaysAgo },
    },
    include: { task: true },
    take: 10,
    orderBy: { createdAt: 'asc' },
  })

  // 미할당 반자동 작업
  const unassignedAssisted = await prisma.assistedTask.count({
    where: {
      task: { serviceId: { in: serviceIds } },
      status: 'CREATED',
      assigneeId: null,
    },
  })

  return {
    channelStatus, taskDistribution, gradeDistribution,
    automationRate, failureRate, avgApprovalHours,
    assistedCompletionRate, recentFailures, approvalBottlenecks,
    unassignedAssisted,
  }
}

export async function getAlerts(serviceIds: string[]): Promise<Alert[]> {
  const alerts: Alert[] = []
  if (serviceIds.length === 0) return alerts

  // 1. 채널 연결 문제
  const problemChannels = await prisma.channelConnection.findMany({
    where: {
      serviceId: { in: serviceIds },
      status: { in: ['FAILED', 'INSUFFICIENT_PERMISSIONS', 'REAUTH_REQUIRED'] },
    },
    include: { channel: true },
  })
  for (const ch of problemChannels) {
    alerts.push({
      id: `channel-${ch.id}`,
      type: 'CHANNEL_ISSUE',
      priority: ch.status === 'FAILED' ? 'URGENT' : 'IMPORTANT',
      title: `채널 연결 문제: ${ch.channel.displayName}`,
      message: `상태: ${ch.status}${ch.errorReason ? ` - ${ch.errorReason}` : ''}`,
      entityId: ch.id,
      createdAt: ch.updatedAt,
    })
  }

  // 2. 승인 SLA 초과 (72시간)
  const slaThreshold = new Date()
  slaThreshold.setHours(slaThreshold.getHours() - 72)
  const overdueApprovals = await prisma.approvalRequest.findMany({
    where: {
      task: { serviceId: { in: serviceIds } },
      status: 'REVIEW_PENDING',
      createdAt: { lt: slaThreshold },
    },
    include: { task: true },
  })
  for (const a of overdueApprovals) {
    const hours = Math.round((Date.now() - a.createdAt.getTime()) / (1000 * 60 * 60))
    alerts.push({
      id: `approval-sla-${a.id}`,
      type: 'APPROVAL_SLA',
      priority: 'IMPORTANT',
      title: `승인 대기 SLA 초과`,
      message: `${a.task.title} - ${hours}시간 대기 중`,
      entityId: a.id,
      createdAt: a.createdAt,
    })
  }

  // 3. 반복 실패 (maxRetries 도달)
  const maxRetryTasks = await prisma.task.findMany({
    where: {
      serviceId: { in: serviceIds },
      status: 'FAILED',
    },
    include: { channelConnection: { include: { channel: true } } },
  })
  for (const t of maxRetryTasks) {
    if (t.retryCount >= t.maxRetries) {
      alerts.push({
        id: `retry-exhausted-${t.id}`,
        type: 'RETRY_EXHAUSTED',
        priority: 'URGENT',
        title: '재시도 횟수 초과',
        message: `${t.title} - ${t.retryCount}회 재시도 후 실패`,
        entityId: t.id,
        createdAt: t.updatedAt,
      })
    }
  }

  // 4. 미할당 반자동 작업 (24시간+)
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)
  const unassigned = await prisma.assistedTask.findMany({
    where: {
      task: { serviceId: { in: serviceIds } },
      status: 'CREATED',
      assigneeId: null,
      createdAt: { lt: oneDayAgo },
    },
    include: { task: true },
  })
  for (const a of unassigned) {
    alerts.push({
      id: `unassigned-${a.id}`,
      type: 'UNASSIGNED_TASK',
      priority: 'NORMAL',
      title: '미할당 반자동 작업',
      message: `${a.task.title} - 24시간 이상 미배정`,
      entityId: a.id,
      createdAt: a.createdAt,
    })
  }

  // 우선순위순 정렬
  const priorityOrder = { URGENT: 0, IMPORTANT: 1, NORMAL: 2 }
  alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return alerts
}
