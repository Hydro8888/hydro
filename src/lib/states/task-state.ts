import { TaskStatus } from '../constants/enums'

type Status = TaskStatus

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  CREATED: ['PENDING', 'APPROVAL_NEEDED', 'USER_ACTION_NEEDED'],
  PENDING: ['RUNNING', 'ON_HOLD'],
  RUNNING: ['COMPLETED', 'FAILED'],
  APPROVAL_NEEDED: ['PENDING', 'REJECTED', 'ON_HOLD'],
  USER_ACTION_NEEDED: ['PENDING', 'COMPLETED', 'ON_HOLD'],
  COMPLETED: [], // 최종 상태
  FAILED: ['RETRY_PENDING', 'ON_HOLD'],
  RETRY_PENDING: ['PENDING', 'FAILED', 'ON_HOLD'],
  REJECTED: ['CREATED'], // 반려 후 재생성 가능
  ON_HOLD: ['PENDING', 'CREATED'],
}

export function canTransitionTask(from: Status, to: Status): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getTaskNextActions(status: Status): { label: string; targetStatus: Status }[] {
  switch (status) {
    case 'CREATED':
      return [{ label: '실행 대기열에 추가', targetStatus: 'PENDING' }]
    case 'PENDING':
      return [{ label: '보류', targetStatus: 'ON_HOLD' }]
    case 'RUNNING':
      return [] // 시스템이 처리
    case 'APPROVAL_NEEDED':
      return [
        { label: '승인', targetStatus: 'PENDING' },
        { label: '반려', targetStatus: 'REJECTED' },
        { label: '보류', targetStatus: 'ON_HOLD' },
      ]
    case 'USER_ACTION_NEEDED':
      return [
        { label: '완료 처리', targetStatus: 'COMPLETED' },
        { label: '실행 요청', targetStatus: 'PENDING' },
        { label: '보류', targetStatus: 'ON_HOLD' },
      ]
    case 'FAILED':
      return [
        { label: '재시도', targetStatus: 'RETRY_PENDING' },
        { label: '보류', targetStatus: 'ON_HOLD' },
      ]
    case 'RETRY_PENDING':
      return [{ label: '보류', targetStatus: 'ON_HOLD' }]
    case 'REJECTED':
      return [{ label: '재생성', targetStatus: 'CREATED' }]
    case 'ON_HOLD':
      return [
        { label: '재개', targetStatus: 'PENDING' },
        { label: '초기화', targetStatus: 'CREATED' },
      ]
    case 'COMPLETED':
      return []
    default:
      return []
  }
}

// 자동화 등급에 따른 초기 상태 결정
export function getInitialTaskStatus(automationGrade: 'A' | 'B' | 'C'): Status {
  switch (automationGrade) {
    case 'A': return 'PENDING'           // 자동 실행 대기
    case 'B': return 'APPROVAL_NEEDED'   // 승인 대기
    case 'C': return 'USER_ACTION_NEEDED' // 사용자 작업 필요
  }
}
