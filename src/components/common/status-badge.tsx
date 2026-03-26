'use client'

import { Badge } from '@/components/ui/badge'
import {
  TaskStatusLabel,
  ChannelConnectionStatusLabel,
  ApprovalStatusLabel,
  AssistedTaskStatusLabel,
} from '@/lib/constants/enums'

type StatusType = 'task' | 'channel' | 'approval' | 'assisted'

const statusColors: Record<string, string> = {
  // 작업 상태
  CREATED: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-blue-100 text-blue-800',
  RUNNING: 'bg-indigo-100 text-indigo-800',
  APPROVAL_NEEDED: 'bg-yellow-100 text-yellow-800',
  USER_ACTION_NEEDED: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  RETRY_PENDING: 'bg-amber-100 text-amber-800',
  REJECTED: 'bg-red-100 text-red-800',
  ON_HOLD: 'bg-gray-100 text-gray-800',
  // 채널 연결 상태
  DISCONNECTED: 'bg-gray-100 text-gray-800',
  CONNECTING: 'bg-blue-100 text-blue-800',
  CONNECTED: 'bg-green-100 text-green-800',
  INSUFFICIENT_PERMISSIONS: 'bg-orange-100 text-orange-800',
  REAUTH_REQUIRED: 'bg-yellow-100 text-yellow-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  // 승인 상태
  REVIEW_PENDING: 'bg-yellow-100 text-yellow-800',
  REVIEWING: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REVISION_REQUESTED: 'bg-orange-100 text-orange-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  // 반자동 작업
  INSUFFICIENT_DATA: 'bg-orange-100 text-orange-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  EVIDENCE_PENDING: 'bg-yellow-100 text-yellow-800',
}

const labelMaps: Record<StatusType, Record<string, string>> = {
  task: TaskStatusLabel,
  channel: ChannelConnectionStatusLabel,
  approval: ApprovalStatusLabel,
  assisted: AssistedTaskStatusLabel,
}

interface Props {
  status: string
  type: StatusType
}

export function StatusBadge({ status, type }: Props) {
  const label = labelMaps[type]?.[status] || status
  const color = statusColors[status] || 'bg-gray-100 text-gray-800'

  return <Badge className={color}>{label}</Badge>
}
