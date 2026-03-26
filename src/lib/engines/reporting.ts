import { prisma } from '../db'

interface DailyReport {
  date: string
  tasksCreated: number
  tasksCompleted: number
  tasksFailed: number
  approvalsPending: number
  approvalsProcessed: number
  urgentIssues: string[]
}

interface WeeklyReport {
  weekStart: string
  weekEnd: string
  automationRate: number
  channelStats: { channelName: string; completed: number; failed: number; total: number }[]
  avgApprovalHours: number | null
  avgAssistedDays: number | null
  totalCompleted: number
  totalFailed: number
  nextWeekPriorities: string[]
}

interface MonthlyReport {
  month: string
  totalTasks: number
  completedTasks: number
  failedTasks: number
  automationRate: number
  gradeDistribution: { grade: string; count: number; percentage: number }[]
  channelContribution: { channelName: string; taskCount: number; completionRate: number }[]
  approvalMetrics: { total: number; approved: number; rejected: number; avgHours: number | null }
  assistedMetrics: { total: number; completed: number; avgDays: number | null }
  recommendations: string[]
}

export async function generateDailyReport(serviceIds: string[], date: Date): Promise<DailyReport> {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const where = { serviceId: { in: serviceIds } }

  const [created, completed, failed, approvalsPending, approvalsProcessed] = await Promise.all([
    prisma.task.count({ where: { ...where, createdAt: { gte: dayStart, lte: dayEnd } } }),
    prisma.task.count({ where: { ...where, status: 'COMPLETED', completedAt: { gte: dayStart, lte: dayEnd } } }),
    prisma.task.count({ where: { ...where, status: 'FAILED', updatedAt: { gte: dayStart, lte: dayEnd } } }),
    prisma.approvalRequest.count({ where: { task: where, status: 'REVIEW_PENDING' } }),
    prisma.approvalRequest.count({ where: { task: where, reviewedAt: { gte: dayStart, lte: dayEnd } } }),
  ])

  const urgentIssues: string[] = []
  if (failed > 0) urgentIssues.push(`${failed}건의 작업이 실패했습니다`)
  if (approvalsPending > 5) urgentIssues.push(`${approvalsPending}건의 승인이 대기 중입니다`)

  return {
    date: dayStart.toISOString().split('T')[0],
    tasksCreated: created,
    tasksCompleted: completed,
    tasksFailed: failed,
    approvalsPending,
    approvalsProcessed,
    urgentIssues,
  }
}

export async function generateWeeklyReport(serviceIds: string[], weekStart: Date): Promise<WeeklyReport> {
  const start = new Date(weekStart)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  const where = { serviceId: { in: serviceIds } }

  const tasks = await prisma.task.findMany({
    where: { ...where, createdAt: { gte: start, lt: end } },
    include: { channelConnection: { include: { channel: true } } },
  })

  const totalCompleted = tasks.filter(t => t.status === 'COMPLETED').length
  const totalFailed = tasks.filter(t => t.status === 'FAILED').length
  const gradeA = tasks.filter(t => t.automationGrade === 'A').length
  const automationRate = tasks.length > 0 ? Math.round(gradeA / tasks.length * 100) : 0

  // 채널별 통계
  const channelMap: Record<string, { completed: number; failed: number; total: number }> = {}
  tasks.forEach(t => {
    const name = t.channelConnection?.channel?.displayName || '미지정'
    if (!channelMap[name]) channelMap[name] = { completed: 0, failed: 0, total: 0 }
    channelMap[name].total++
    if (t.status === 'COMPLETED') channelMap[name].completed++
    if (t.status === 'FAILED') channelMap[name].failed++
  })
  const channelStats = Object.entries(channelMap).map(([channelName, stats]) => ({ channelName, ...stats }))

  // 승인 처리 속도
  const approvals = await prisma.approvalRequest.findMany({
    where: { task: where, status: 'APPROVED', reviewedAt: { gte: start, lt: end } },
    select: { createdAt: true, reviewedAt: true },
  })
  let avgApprovalHours: number | null = null
  if (approvals.length > 0) {
    const totalH = approvals.reduce((s, a) => s + (a.reviewedAt!.getTime() - a.createdAt.getTime()) / 3600000, 0)
    avgApprovalHours = Math.round(totalH / approvals.length * 10) / 10
  }

  // 반자동 처리 속도
  const assisted = await prisma.assistedTask.findMany({
    where: { task: where, status: 'COMPLETED', completedAt: { gte: start, lt: end } },
    select: { createdAt: true, completedAt: true },
  })
  let avgAssistedDays: number | null = null
  if (assisted.length > 0) {
    const totalD = assisted.reduce((s, a) => s + (a.completedAt!.getTime() - a.createdAt.getTime()) / 86400000, 0)
    avgAssistedDays = Math.round(totalD / assisted.length * 10) / 10
  }

  const nextWeekPriorities: string[] = []
  if (totalFailed > 0) nextWeekPriorities.push(`실패 작업 ${totalFailed}건 해결`)
  if (automationRate < 30) nextWeekPriorities.push('자동화율 개선 필요')
  if (avgApprovalHours && avgApprovalHours > 48) nextWeekPriorities.push('승인 처리 속도 개선')

  return {
    weekStart: start.toISOString().split('T')[0],
    weekEnd: end.toISOString().split('T')[0],
    automationRate,
    channelStats,
    avgApprovalHours,
    avgAssistedDays,
    totalCompleted,
    totalFailed,
    nextWeekPriorities,
  }
}

export async function generateMonthlyReport(serviceIds: string[], month: Date): Promise<MonthlyReport> {
  const start = new Date(month.getFullYear(), month.getMonth(), 1)
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1)

  const where = { serviceId: { in: serviceIds } }

  const tasks = await prisma.task.findMany({
    where: { ...where, createdAt: { gte: start, lt: end } },
    include: { channelConnection: { include: { channel: true } } },
  })

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
  const failedTasks = tasks.filter(t => t.status === 'FAILED').length
  const gradeA = tasks.filter(t => t.automationGrade === 'A').length
  const gradeB = tasks.filter(t => t.automationGrade === 'B').length
  const gradeC = tasks.filter(t => t.automationGrade === 'C').length
  const total = totalTasks || 1
  const automationRate = Math.round(gradeA / total * 100)

  const gradeDistribution = [
    { grade: 'A', count: gradeA, percentage: Math.round(gradeA / total * 100) },
    { grade: 'B', count: gradeB, percentage: Math.round(gradeB / total * 100) },
    { grade: 'C', count: gradeC, percentage: Math.round(gradeC / total * 100) },
  ]

  // 채널별 기여도
  const chMap: Record<string, { count: number; completed: number }> = {}
  tasks.forEach(t => {
    const name = t.channelConnection?.channel?.displayName || '미지정'
    if (!chMap[name]) chMap[name] = { count: 0, completed: 0 }
    chMap[name].count++
    if (t.status === 'COMPLETED') chMap[name].completed++
  })
  const channelContribution = Object.entries(chMap).map(([channelName, s]) => ({
    channelName, taskCount: s.count, completionRate: Math.round(s.completed / (s.count || 1) * 100),
  }))

  // 승인 지표
  const allApprovals = await prisma.approvalRequest.findMany({
    where: { task: where, createdAt: { gte: start, lt: end } },
    select: { status: true, createdAt: true, reviewedAt: true },
  })
  const approved = allApprovals.filter(a => a.status === 'APPROVED')
  const rejected = allApprovals.filter(a => a.status === 'REJECTED')
  let approvalAvgH: number | null = null
  if (approved.length > 0) {
    const h = approved.filter(a => a.reviewedAt).reduce((s, a) => s + (a.reviewedAt!.getTime() - a.createdAt.getTime()) / 3600000, 0)
    approvalAvgH = Math.round(h / approved.length * 10) / 10
  }

  // 반자동 지표
  const allAssisted = await prisma.assistedTask.findMany({
    where: { task: where, createdAt: { gte: start, lt: end } },
    select: { status: true, createdAt: true, completedAt: true },
  })
  const assistedDone = allAssisted.filter(a => a.status === 'COMPLETED')
  let assistedAvgD: number | null = null
  if (assistedDone.length > 0) {
    const d = assistedDone.filter(a => a.completedAt).reduce((s, a) => s + (a.completedAt!.getTime() - a.createdAt.getTime()) / 86400000, 0)
    assistedAvgD = Math.round(d / assistedDone.length * 10) / 10
  }

  const recommendations: string[] = []
  if (automationRate < 30) recommendations.push('자동화 등급 A 비율을 높이기 위해 저위험 작업의 자동화 범위를 검토하세요')
  if (failedTasks > totalTasks * 0.1) recommendations.push('실패율이 10%를 초과했습니다. 실패 원인을 분석하세요')
  if (rejected.length > approved.length * 0.3) recommendations.push('반려율이 높습니다. 초안 품질 개선이 필요합니다')
  if (recommendations.length === 0) recommendations.push('운영이 안정적입니다. 신규 채널 확장을 검토해보세요')

  return {
    month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
    totalTasks, completedTasks, failedTasks, automationRate,
    gradeDistribution, channelContribution,
    approvalMetrics: { total: allApprovals.length, approved: approved.length, rejected: rejected.length, avgHours: approvalAvgH },
    assistedMetrics: { total: allAssisted.length, completed: assistedDone.length, avgDays: assistedAvgD },
    recommendations,
  }
}
