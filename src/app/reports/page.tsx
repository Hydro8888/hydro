'use client'

import { Card, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">보고서 센터</h2>
        <p className="text-muted-foreground">운영 보고서를 생성하고 확인합니다</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Phase 3에서 구현 예정</h3>
          <p className="text-muted-foreground">
            일간/주간/월간 보고서, 자동화율, 승인 병목 현황이 추가됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
