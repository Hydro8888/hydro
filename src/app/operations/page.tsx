'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Activity } from 'lucide-react'

export default function OperationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">운영 센터</h2>
        <p className="text-muted-foreground">채널 운영 현황을 모니터링합니다</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center p-12 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Phase 3에서 구현 예정</h3>
          <p className="text-muted-foreground">
            리뷰 상태, 검색 성과, 채널 운영 상태, 경고 이벤트 모니터링이 추가됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
