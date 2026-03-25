'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CheckSquare } from 'lucide-react'

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">승인 센터</h2>
        <p className="text-muted-foreground">승인이 필요한 작업을 검토하고 처리합니다</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center p-12 text-center">
          <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Phase 2에서 구현 예정</h3>
          <p className="text-muted-foreground">
            변경 전/후 비교, 위험 수준 표시, 승인/반려/수정 요청 기능이 추가됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
