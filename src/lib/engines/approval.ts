import { prisma } from '../db'
import { canTransitionApproval } from '../states/approval-state'
import { canTransitionTask } from '../states/task-state'
import { notifyApprovalResult, notifyApprovalExpired } from './notification'
import type { ApprovalStatus } from '../constants/enums'

type ApprovalAction = 'start_review' | 'approve' | 'request_revision' | 'reject'

interface ProcessApprovalParams {
  approvalId: string
  action: ApprovalAction
  reviewerId: string
  rejectionReason?: string
  revisedContent?: any
}

const ACTION_TO_STATUS: Record<ApprovalAction, ApprovalStatus> = {
  start_review: 'REVIEWING',
  approve: 'APPROVED',
  request_revision: 'REVISION_REQUESTED',
  reject: 'REJECTED',
}

export async function processApproval(params: ProcessApprovalParams) {
  const { approvalId, action, reviewerId, rejectionReason, revisedContent } = params

  const approval = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
    include: { task: true },
  })

  if (!approval) {
    throw new Error('승인 요청을 찾을 수 없습니다')
  }

  const newStatus = ACTION_TO_STATUS[action]

  // 상태 전이 검증
  if (!canTransitionApproval(approval.status as ApprovalStatus, newStatus as ApprovalStatus)) {
    throw new Error(`${approval.status}에서 ${newStatus}로 전환할 수 없습니다`)
  }

  // 승인 상태 업데이트
  const updatedApproval = await prisma.approvalRequest.update({
    where: { id: approvalId },
    data: {
      status: newStatus,
      reviewerId,
      reviewedAt: action !== 'start_review' ? new Date() : undefined,
      rejectionReason: rejectionReason || undefined,
      approvedContent: action === 'approve' ? (revisedContent || approval.draftContent) : undefined,
    },
  })

  // 작업 상태 cascading
  if (action === 'approve') {
    if (canTransitionTask(approval.task.status as any, 'PENDING')) {
      await prisma.task.update({
        where: { id: approval.taskId },
        data: { status: 'PENDING' },
      })
    }
  } else if (action === 'reject') {
    if (canTransitionTask(approval.task.status as any, 'REJECTED')) {
      await prisma.task.update({
        where: { id: approval.taskId },
        data: {
          status: 'REJECTED',
          errorReason: rejectionReason || '승인 반려됨',
        },
      })
    }
  }
  // request_revision: 작업 상태는 유지, 수정 대기

  // 감사 로그
  await prisma.auditLog.create({
    data: {
      entityType: 'ApprovalRequest',
      entityId: approvalId,
      action: action.toUpperCase(),
      userId: reviewerId,
      before: { status: approval.status },
      after: { status: newStatus, rejectionReason },
    },
  })

  // 알림 생성 (start_review 제외)
  if (action !== 'start_review') {
    await notifyApprovalResult(approvalId, newStatus as any)
  }

  return updatedApproval
}

// 만료된 승인 요청 체크 (7일 기준)
export async function checkExpiredApprovals() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const expired = await prisma.approvalRequest.findMany({
    where: {
      status: 'REVIEW_PENDING',
      createdAt: { lt: sevenDaysAgo },
    },
  })

  for (const approval of expired) {
    if (canTransitionApproval('REVIEW_PENDING', 'EXPIRED')) {
      await prisma.approvalRequest.update({
        where: { id: approval.id },
        data: { status: 'EXPIRED' },
      })
      await notifyApprovalExpired(approval.id)
    }
  }

  return expired.length
}
