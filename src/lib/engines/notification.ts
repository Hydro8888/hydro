import { prisma } from '../db'
import { getCurrentUser } from '../auth'

interface CreateNotificationParams {
  userId: string
  type: string
  priority: 'URGENT' | 'IMPORTANT' | 'NORMAL' | 'RECOMMENDATION'
  title: string
  message: string
  actionUrl?: string
}

export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      priority: params.priority,
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl,
    },
  })
}

export async function notifyApprovalNeeded(approvalId: string) {
  const approval = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
    include: {
      task: {
        include: { service: true },
      },
    },
  })
  if (!approval) return

  // 검수자와 관리자에게 알림
  const reviewers = await prisma.user.findMany({
    where: { role: { in: ['REVIEWER', 'MANAGER', 'OWNER'] } },
  })

  for (const reviewer of reviewers) {
    await createNotification({
      userId: reviewer.id,
      type: 'APPROVAL_PENDING',
      priority: 'IMPORTANT',
      title: '새로운 승인 요청',
      message: `${approval.task.title} 작업에 대한 승인이 필요합니다.`,
      actionUrl: `/approvals/${approvalId}`,
    })
  }
}

export async function notifyApprovalResult(approvalId: string, result: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED') {
  const approval = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
    include: {
      task: { include: { service: true } },
    },
  })
  if (!approval) return

  const resultLabels = {
    APPROVED: '승인되었습니다',
    REJECTED: '반려되었습니다',
    REVISION_REQUESTED: '수정이 요청되었습니다',
  }

  const priority = result === 'REJECTED' ? 'IMPORTANT' as const : 'NORMAL' as const

  await createNotification({
    userId: approval.task.service.userId,
    type: `APPROVAL_${result}`,
    priority,
    title: `승인 결과: ${resultLabels[result]}`,
    message: `${approval.task.title} 작업이 ${resultLabels[result]}${approval.rejectionReason ? ` 사유: ${approval.rejectionReason}` : ''}`,
    actionUrl: `/approvals/${approvalId}`,
  })
}

export async function notifyTaskFailed(taskId: string, reason: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { service: true },
  })
  if (!task) return

  await createNotification({
    userId: task.service.userId,
    type: 'TASK_FAILED',
    priority: 'URGENT',
    title: '작업 실패',
    message: `${task.title} 작업이 실패했습니다. 사유: ${reason}`,
    actionUrl: `/tasks`,
  })
}

export async function notifyAssistedTaskAssigned(assistedTaskId: string) {
  const assisted = await prisma.assistedTask.findUnique({
    where: { id: assistedTaskId },
    include: { task: true },
  })
  if (!assisted || !assisted.assigneeId) return

  await createNotification({
    userId: assisted.assigneeId,
    type: 'ASSISTED_TASK_ASSIGNED',
    priority: 'IMPORTANT',
    title: '반자동 작업 배정',
    message: `${assisted.task.title} 작업이 배정되었습니다. 지침을 확인하고 작업을 진행해주세요.`,
    actionUrl: `/assisted/${assistedTaskId}`,
  })
}

export async function notifyAssistedTaskCompleted(assistedTaskId: string) {
  const assisted = await prisma.assistedTask.findUnique({
    where: { id: assistedTaskId },
    include: { task: { include: { service: true } } },
  })
  if (!assisted) return

  // 검수자에게 알림
  const reviewers = await prisma.user.findMany({
    where: { role: { in: ['REVIEWER', 'MANAGER'] } },
  })

  for (const reviewer of reviewers) {
    await createNotification({
      userId: reviewer.id,
      type: 'ASSISTED_TASK_REVIEW_NEEDED',
      priority: 'NORMAL',
      title: '반자동 작업 검수 요청',
      message: `${assisted.task.title} 작업의 검수가 필요합니다.`,
      actionUrl: `/assisted/${assistedTaskId}`,
    })
  }
}
