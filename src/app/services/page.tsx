'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ServiceTypeLabel } from '@/lib/constants/enums'
import { Briefcase, ExternalLink } from 'lucide-react'

interface ServiceItem {
  id: string
  name: string
  url: string | null
  type: string
  description: string
  isLocal: boolean
  isApp: boolean
  isB2B: boolean
  _count: {
    goals: number
    channelConnections: number
    tasks: number
  }
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (data.success) setServices(data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">서비스 자산 센터</h2>
          <p className="text-muted-foreground">등록된 서비스와 브랜드 자산을 관리합니다</p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + 새 서비스 등록
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-24 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">등록된 서비스가 없습니다</h3>
            <p className="text-muted-foreground">새 서비스를 등록해보세요.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map(service => (
            <Link key={service.id} href={`/services/${service.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <Badge variant="secondary">
                      {ServiceTypeLabel[service.type as keyof typeof ServiceTypeLabel] || service.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                  {service.url && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      {service.url}
                    </div>
                  )}
                  <div className="flex gap-4 text-sm">
                    <span>목표 {service._count.goals}개</span>
                    <span>채널 {service._count.channelConnections}개</span>
                    <span>작업 {service._count.tasks}개</span>
                  </div>
                  <div className="flex gap-2">
                    {service.isLocal && <Badge variant="info">로컬</Badge>}
                    {service.isApp && <Badge variant="info">앱</Badge>}
                    {service.isB2B && <Badge variant="info">B2B</Badge>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
