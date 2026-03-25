'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { StatusBadge } from '@/components/common/status-badge'
import { AutomationGradeBadge } from '@/components/common/automation-grade-badge'
import type { AutomationGrade } from '@/lib/constants/enums'
import { Link2 } from 'lucide-react'
import { apiUrl } from '@/lib/api'

export default function ChannelConnectionsPage() {
  const [services, setServices] = useState<any[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [connections, setConnections] = useState<any[]>([])

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
      fetch(apiUrl(`/api/channels/connections?serviceId=${selectedServiceId}`))
        .then(res => res.json())
        .then(data => {
          if (data.success) setConnections(data.data)
        })
    }
  }, [selectedServiceId])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">채널 연결</h2>
        <p className="text-muted-foreground">연결된 채널의 상태를 관리합니다</p>
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

      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center">
            <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">연결된 채널이 없습니다</h3>
            <p className="text-muted-foreground">채널 탐색에서 추천 채널을 확인하고 연결해보세요.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {connections.map((conn: any) => (
            <Card key={conn.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{conn.channel.displayName}</span>
                      <AutomationGradeBadge grade={conn.channel.automationCapability as AutomationGrade} />
                    </div>
                    <p className="text-sm text-muted-foreground">{conn.channel.description}</p>
                    {conn.errorReason && (
                      <p className="text-sm text-red-600 mt-1">오류: {conn.errorReason}</p>
                    )}
                  </div>
                </div>
                <StatusBadge status={conn.status} type="channel" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
