'use client'

import { Badge } from '@/components/ui/badge'
import { AutomationGradeLabel, AutomationGradeDescription } from '@/lib/constants/enums'
import type { AutomationGrade } from '@/lib/constants/enums'

interface Props {
  grade: AutomationGrade
  showDescription?: boolean
}

const gradeColors: Record<AutomationGrade, string> = {
  A: 'bg-green-100 text-green-800 border-green-200',
  B: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  C: 'bg-blue-100 text-blue-800 border-blue-200',
}

export function AutomationGradeBadge({ grade, showDescription }: Props) {
  return (
    <div className="inline-flex items-center gap-2">
      <Badge className={gradeColors[grade]}>
        {grade} - {AutomationGradeLabel[grade]}
      </Badge>
      {showDescription && (
        <span className="text-xs text-muted-foreground">
          {AutomationGradeDescription[grade]}
        </span>
      )}
    </div>
  )
}
