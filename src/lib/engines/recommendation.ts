import { prisma } from '../db'

interface Recommendation {
  type: string
  title: string
  reason: string
  priority: number
  payload: Record<string, any>
}

// 추천 엔진: 성과 분석 결과를 바탕으로 다음 액션 추천
// Phase 4: 규칙 기반. 향후 AI 기반으로 전환 예정.

export async function generateRecommendations(serviceIds: string[]): Promise<Recommendation[]> {
  if (serviceIds.length === 0) return []

  const recommendations: Recommendation[] = []
  const where = { serviceId: { in: serviceIds } }

  // 데이터 수집
  const [tasks, connections, approvals, assistedTasks] = await Promise.all([
    prisma.task.findMany({ where, include: { channelConnection: { include: { channel: true } } } }),
    prisma.channelConnection.findMany({ where: { serviceId: { in: serviceIds } }, include: { channel: true } }),
    prisma.approvalRequest.findMany({ where: { task: where } }),
    prisma.assistedTask.findMany({ where: { task: where } }),
  ])

  const totalTasks = tasks.length
  if (totalTasks === 0) {
    recommendations.push({
      type: 'GET_STARTED',
      title: '서비스를 등록하고 채널을 연결하세요',
      reason: '아직 작업이 생성되지 않았습니다. 서비스를 등록하고 채널을 연결하면 작업이 자동 생성됩니다.',
      priority: 100,
      payload: { actionUrl: '/onboarding' },
    })
    return recommendations
  }

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
  const failedTasks = tasks.filter(t => t.status === 'FAILED').length
  const gradeA = tasks.filter(t => t.automationGrade === 'A').length
  const gradeB = tasks.filter(t => t.automationGrade === 'B').length
  const gradeC = tasks.filter(t => t.automationGrade === 'C').length
  const automationRate = Math.round(gradeA / totalTasks * 100)
  const failureRate = Math.round(failedTasks / totalTasks * 100)

  // 1. 실패율 높음 → 원인 분석 제안
  if (failureRate > 10) {
    const failureReasons = tasks
      .filter(t => t.status === 'FAILED' && t.errorReason)
      .map(t => t.errorReason!)
    const uniqueReasons = failureReasons.filter((r, i) => failureReasons.indexOf(r) === i)

    recommendations.push({
      type: 'HIGH_FAILURE_RATE',
      title: '실패율이 높습니다 - 원인 분석이 필요합니다',
      reason: `실패율 ${failureRate}%. 주요 원인: ${uniqueReasons.slice(0, 3).join(', ') || '확인 필요'}`,
      priority: 90,
      payload: { failureRate, topReasons: uniqueReasons.slice(0, 5) },
    })
  }

  // 2. 자동화율 낮음 → 자동화 범위 확대 제안
  if (automationRate < 30 && totalTasks > 5) {
    recommendations.push({
      type: 'LOW_AUTOMATION',
      title: '자동화율을 높여보세요',
      reason: `현재 자동화율 ${automationRate}%. B/C 등급 작업 중 반복적으로 승인되는 패턴이 있다면 A등급으로 승격을 검토하세요.`,
      priority: 70,
      payload: { automationRate, gradeB, gradeC },
    })
  }

  // 3. 승인 반려율 높음 → 초안 품질 개선
  const approvedCount = approvals.filter(a => a.status === 'APPROVED').length
  const rejectedCount = approvals.filter(a => a.status === 'REJECTED').length
  if (approvals.length > 3 && rejectedCount > approvedCount * 0.3) {
    recommendations.push({
      type: 'HIGH_REJECTION_RATE',
      title: '승인 반려율이 높습니다 - 초안 품질을 개선하세요',
      reason: `승인 ${approvedCount}건 중 반려 ${rejectedCount}건. 초안 생성 규칙을 점검하세요.`,
      priority: 75,
      payload: { approved: approvedCount, rejected: rejectedCount },
    })
  }

  // 4. 승인 대기 지연 → 승인자 추가 또는 자동 승격 제안
  const pendingApprovals = approvals.filter(a => a.status === 'REVIEW_PENDING')
  if (pendingApprovals.length > 5) {
    recommendations.push({
      type: 'APPROVAL_BOTTLENECK',
      title: '승인 병목이 발생하고 있습니다',
      reason: `${pendingApprovals.length}건의 승인이 대기 중입니다. 추가 검수자를 배정하거나 저위험 작업의 자동 승인을 검토하세요.`,
      priority: 80,
      payload: { pendingCount: pendingApprovals.length },
    })
  }

  // 5. 반복 승인 패턴 → 자동화 승격 제안
  const repeatedApprovals = findRepeatedApprovalPatterns(approvals)
  if (repeatedApprovals.length > 0) {
    recommendations.push({
      type: 'AUTOMATION_UPGRADE',
      title: '자동화 승격 후보가 있습니다',
      reason: `반복적으로 승인되는 작업 유형이 감지되었습니다. 이 작업들을 A등급(자동 실행)으로 승격하면 운영 효율이 올라갑니다.`,
      priority: 65,
      payload: { patterns: repeatedApprovals },
    })
  }

  // 6. 미할당 반자동 작업 → 담당자 배정 촉구
  const unassigned = assistedTasks.filter(a => a.status === 'CREATED' && !a.assigneeId)
  if (unassigned.length > 0) {
    recommendations.push({
      type: 'UNASSIGNED_TASKS',
      title: '미할당 반자동 작업이 있습니다',
      reason: `${unassigned.length}건의 반자동 작업에 담당자가 배정되지 않았습니다.`,
      priority: 60,
      payload: { count: unassigned.length, actionUrl: '/assisted' },
    })
  }

  // 7. 연결 안 된 추천 채널 → 새 채널 확장 제안
  const connectedChannelIds = connections.map(c => c.channelId)
  const allChannels = await prisma.channel.findMany({ where: { isActive: true } })
  const unconnectedCount = allChannels.filter(ch => !connectedChannelIds.includes(ch.id)).length
  if (unconnectedCount > 3 && connections.length > 0) {
    recommendations.push({
      type: 'EXPAND_CHANNELS',
      title: '추가 채널을 연결해보세요',
      reason: `아직 연결하지 않은 채널이 ${unconnectedCount}개 있습니다. 채널 탐색에서 적합도를 확인해보세요.`,
      priority: 40,
      payload: { unconnectedCount, actionUrl: '/channels' },
    })
  }

  // 8. 완료율 높으면 칭찬 + 최적화 제안
  const completionRate = Math.round(completedTasks / totalTasks * 100)
  if (completionRate > 80 && totalTasks > 10) {
    recommendations.push({
      type: 'GOOD_PERFORMANCE',
      title: '운영이 안정적입니다',
      reason: `완료율 ${completionRate}%. 자동화 범위를 확대하거나 신규 채널 진출을 검토해보세요.`,
      priority: 20,
      payload: { completionRate },
    })
  }

  // 우선순위 내림차순 정렬
  recommendations.sort((a, b) => b.priority - a.priority)

  return recommendations
}

// 반복 승인 패턴 감지
function findRepeatedApprovalPatterns(approvals: any[]): string[] {
  const approved = approvals.filter(a => a.status === 'APPROVED')
  if (approved.length < 3) return []

  // 같은 taskType이 3회 이상 연속 승인된 패턴 찾기
  // 단순화: draftContent에서 taskType 추출
  const typeCount: Record<string, number> = {}
  approved.forEach(a => {
    const content = a.draftContent as any
    const taskType = content?.taskType || 'unknown'
    typeCount[taskType] = (typeCount[taskType] || 0) + 1
  })

  return Object.entries(typeCount)
    .filter(([, count]) => count >= 3)
    .map(([type]) => type)
}

// 추천 액션을 DB에 저장
export async function saveRecommendations(serviceId: string, recommendations: Recommendation[]) {
  // 기존 미수락 추천 삭제
  await prisma.recommendedAction.deleteMany({
    where: { serviceId, accepted: null },
  })

  // 새 추천 저장
  for (const rec of recommendations) {
    await prisma.recommendedAction.create({
      data: {
        serviceId,
        type: rec.type,
        title: rec.title,
        reason: rec.reason,
        priority: rec.priority,
        payload: rec.payload,
      },
    })
  }
}
