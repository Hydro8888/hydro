import { ApprovalStatus } from '../constants/enums'

type Status = ApprovalStatus

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  REVIEW_PENDING: ['REVIEWING', 'EXPIRED'],
  REVIEWING: ['APPROVED', 'REVISION_REQUESTED', 'REJECTED'],
  APPROVED: [],     // 최종 상태
  REVISION_REQUESTED: ['REVIEW_PENDING'],
  REJECTED: [],     // 최종 상태
  EXPIRED: ['REVIEW_PENDING'], // 재요청 가능
}

export function canTransitionApproval(from: Status, to: Status): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getApprovalNextActions(status: Status): { label: string; targetStatus: Status }[] {
  switch (status) {
    case 'REVIEW_PENDING':
      return [{ label: '검토 시작', targetStatus: 'REVIEWING' }]
    case 'REVIEWING':
      return [
        { label: '승인', targetStatus: 'APPROVED' },
        { label: '수정 요청', targetStatus: 'REVISION_REQUESTED' },
        { label: '반려', targetStatus: 'REJECTED' },
      ]
    case 'REVISION_REQUESTED':
      return [{ label: '재검토 요청', targetStatus: 'REVIEW_PENDING' }]
    case 'EXPIRED':
      return [{ label: '재요청', targetStatus: 'REVIEW_PENDING' }]
    case 'APPROVED':
    case 'REJECTED':
      return []
    default:
      return []
  }
}
