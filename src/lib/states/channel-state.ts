import { ChannelConnectionStatus } from '../constants/enums'

type Status = ChannelConnectionStatus

// 허용된 상태 전이 맵
const VALID_TRANSITIONS: Record<Status, Status[]> = {
  DISCONNECTED: ['CONNECTING'],
  CONNECTING: ['CONNECTED', 'FAILED', 'INSUFFICIENT_PERMISSIONS'],
  CONNECTED: ['DISCONNECTED', 'REAUTH_REQUIRED', 'SUSPENDED'],
  FAILED: ['CONNECTING', 'DISCONNECTED'],
  INSUFFICIENT_PERMISSIONS: ['CONNECTING', 'DISCONNECTED'],
  REAUTH_REQUIRED: ['CONNECTING', 'DISCONNECTED', 'SUSPENDED'],
  SUSPENDED: ['CONNECTING', 'DISCONNECTED'],
}

export function canTransitionChannel(from: Status, to: Status): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextActions(status: Status): { label: string; targetStatus: Status }[] {
  switch (status) {
    case 'DISCONNECTED':
      return [{ label: '연결 시작', targetStatus: 'CONNECTING' }]
    case 'CONNECTING':
      return [] // 시스템이 처리
    case 'CONNECTED':
      return [
        { label: '연결 해제', targetStatus: 'DISCONNECTED' },
        { label: '운영 중지', targetStatus: 'SUSPENDED' },
      ]
    case 'FAILED':
      return [
        { label: '재연결', targetStatus: 'CONNECTING' },
        { label: '연결 해제', targetStatus: 'DISCONNECTED' },
      ]
    case 'INSUFFICIENT_PERMISSIONS':
      return [
        { label: '재연결 (권한 확인 후)', targetStatus: 'CONNECTING' },
        { label: '연결 해제', targetStatus: 'DISCONNECTED' },
      ]
    case 'REAUTH_REQUIRED':
      return [
        { label: '재인증', targetStatus: 'CONNECTING' },
        { label: '연결 해제', targetStatus: 'DISCONNECTED' },
      ]
    case 'SUSPENDED':
      return [
        { label: '재시작', targetStatus: 'CONNECTING' },
        { label: '연결 해제', targetStatus: 'DISCONNECTED' },
      ]
    default:
      return []
  }
}
