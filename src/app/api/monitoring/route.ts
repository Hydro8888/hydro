import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getOperationalMetrics, getAlerts } from '@/lib/engines/monitoring'

export async function GET() {
  try {
    const user = getCurrentUser()
    const services = await prisma.service.findMany({
      where: { userId: user.id },
      select: { id: true },
    })
    const serviceIds = services.map(s => s.id)

    const [metrics, alerts] = await Promise.all([
      getOperationalMetrics(serviceIds),
      getAlerts(serviceIds),
    ])

    return NextResponse.json({ success: true, data: { metrics, alerts } })
  } catch (error) {
    console.error('Monitoring error:', error)
    return NextResponse.json({ success: false, error: '모니터링 조회에 실패했습니다' }, { status: 500 })
  }
}
