'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { AutomationGradeBadge } from '@/components/common/automation-grade-badge'
import { Badge } from '@/components/ui/badge'
import type { ChannelRecommendation } from '@/types'
import type { AutomationGrade } from '@/lib/constants/enums'
import { Search, Loader2 } from 'lucide-react'
import { apiUrl } from '@/lib/api'

export default function ChannelExplorerPage() {
  const [services, setServices] = useState<any[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [recommendations, setRecommendations] = useState<ChannelRecommendation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(apiUrl('/api/services'))
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setServices(data.data)
          setSelectedServiceId(data.data[0].id)
        }
      })
  }, [])

  useEffect(() => {
    if (selectedServiceId) {
      setLoading(true)
      fetch(apiUrl(`/api/channels/recommendations?serviceId=${selectedServiceId}`))
        .then(res => res.json())
        .then(data => {
          if (data.success) setRecommendations(data.data.recommendations)
        })
        .finally(() => setLoading(false))
    }
  }, [selectedServiceId])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">채널 탐색</h2>
        <p className="text-muted-foreground">서비스에 적합한 마케팅 채널을 탐색합니다</p>
      </div>

      {services.length > 0 && (
        <Select
          label="서비스 선택"
          value={selectedServiceId}
          onChange={e => setSelectedServiceId(e.target.value)}
          className="max-w-md"
        >
          {services.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          채널 적합도 분석 중...
        </div>
      ) : recommendations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">추천 채널을 조회하려면 서비스를 먼저 등록해주세요</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.channelName}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{rec.displayName}</h3>
                      <AutomationGradeBadge grade={rec.automationGrade as AutomationGrade} showDescription />
                      {rec.readyNow && <Badge variant="success">바로 시작 가능</Badge>}
                    </div>
                    <Badge variant="outline">{rec.category}</Badge>

                    {rec.reasons.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">추천 이유:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {rec.reasons.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}

                    {rec.missingItems.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-orange-600">부족한 항목:</p>
                        <div className="flex gap-1 mt-1">
                          {rec.missingItems.map(item => (
                            <Badge key={item} variant="outline" className="text-orange-600 border-orange-200">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{rec.score}</div>
                    <div className="text-xs text-muted-foreground">적합도</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
