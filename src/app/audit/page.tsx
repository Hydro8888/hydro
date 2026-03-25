'use client'

import { Card, CardContent } from '@/components/ui/card'
import { History } from 'lucide-react'

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">감사 이력</h2>
        <p className="text-muted-foreground">모든 변경 이력과 실행 로그를 확인합니다</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center p-12 text-center">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Phase 3에서 구현 예정</h3>
          <p className="text-muted-foreground">
            변경 이력, 자동/수동 실행 구분, 반려 사유, 재시도 이력이 추가됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
