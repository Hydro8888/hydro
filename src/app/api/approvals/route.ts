import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')
    const serviceId = request.nextUrl.searchParams.get('serviceId')

    const where: any = {}
    if (status) where.status = status
    if (serviceId) where.task = { serviceId }

    const approvals = await prisma.approvalRequest.findMany({
      where,
      include: {
        task: {
          include: {
            channelConnection: { include: { channel: true } },
            service: true,
          },
        },
        reviewer: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: approvals })
  } catch (error) {
    console.error('Approvals list error:', error)
    return NextResponse.json({ success: false, error: '승인 목록 조회에 실패했습니다' }, { status: 500 })
  }
}
