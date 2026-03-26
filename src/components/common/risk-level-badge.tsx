'use client'

import { Badge } from '@/components/ui/badge'

const riskColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
}

const riskLabels: Record<string, string> = {
  LOW: '저위험',
  MEDIUM: '중위험',
  HIGH: '고위험',
  CRITICAL: '매우 위험',
}

export function RiskLevelBadge({ level }: { level: string | null | undefined }) {
  if (!level) return null
  return (
    <Badge className={riskColors[level] || riskColors.MEDIUM}>
      {riskLabels[level] || level}
    </Badge>
  )
}
