import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getPipelineStatus } from '@/lib/engines/pipeline'

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser()
    const serviceId = request.nextUrl.searchParams.get('serviceId')

    let serviceIds: string[]

    if (serviceId) {
      // 특정 서비스만
      const service = await prisma.service.findFirst({
        where: { id: serviceId, userId: user.id },
        select: { id: true },
      })
      serviceIds = service ? [service.id] : []
    } else {
      // 전체 서비스
      const services = await prisma.service.findMany({
        where: { userId: user.id },
        select: { id: true },
      })
      serviceIds = services.map(s => s.id)
    }

    const pipelineStatus = await getPipelineStatus(serviceIds)

    return NextResponse.json({ success: true, data: pipelineStatus })
  } catch (error) {
    console.error('Pipeline status error:', error)
    return NextResponse.json(
      { success: false, error: '파이프라인 상태 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
