import { AssistedTaskStatus } from '../constants/enums'

type Status = AssistedTaskStatus

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  CREATED: ['INSUFFICIENT_DATA', 'ASSIGNED'],
  INSUFFICIENT_DATA: ['ASSIGNED', 'CREATED'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['EVIDENCE_PENDING', 'COMPLETED'],
  EVIDENCE_PENDING: ['REVIEW_PENDING'],
  REVIEW_PENDING: ['COMPLETED', 'REJECTED'],
  COMPLETED: [],   // 최종 상태
  REJECTED: ['CREATED', 'IN_PROGRESS'],
}

export function canTransitionAssistedTask(from: Status, to: Status): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getAssistedTaskNextActions(status: Status): { label: string; targetStatus: Status }[] {
  switch (status) {
    case 'CREATED':
      return [
        { label: '담당자 배정', targetStatus: 'ASSIGNED' },
        { label: '자료 부족 표시', targetStatus: 'INSUFFICIENT_DATA' },
      ]
    case 'INSUFFICIENT_DATA':
      return [
        { label: '자료 보완 완료', targetStatus: 'ASSIGNED' },
      ]
    case 'ASSIGNED':
      return [{ label: '작업 시작', targetStatus: 'IN_PROGRESS' }]
    case 'IN_PROGRESS':
      return [
        { label: '증빙 제출', targetStatus: 'EVIDENCE_PENDING' },
        { label: '바로 완료', targetStatus: 'COMPLETED' },
      ]
    case 'EVIDENCE_PENDING':
      return [{ label: '검수 요청', targetStatus: 'REVIEW_PENDING' }]
    case 'REVIEW_PENDING':
      return [
        { label: '검수 완료', targetStatus: 'COMPLETED' },
        { label: '반려', targetStatus: 'REJECTED' },
      ]
    case 'REJECTED':
      return [
        { label: '재작업', targetStatus: 'IN_PROGRESS' },
        { label: '초기화', targetStatus: 'CREATED' },
      ]
    case 'COMPLETED':
      return []
    default:
      return []
  }
}
