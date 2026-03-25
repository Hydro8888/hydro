import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')
    const serviceId = request.nextUrl.searchParams.get('serviceId')
    const assigneeId = request.nextUrl.searchParams.get('assigneeId')

    const where: any = {}
    if (status) where.status = status
    if (assigneeId) where.assigneeId = assigneeId
    if (serviceId) where.task = { serviceId }

    const assistedTasks = await prisma.assistedTask.findMany({
      where,
      include: {
        task: {
          include: {
            channelConnection: { include: { channel: true } },
            service: true,
          },
        },
        assignee: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: assistedTasks })
  } catch (error) {
    console.error('Assisted tasks list error:', error)
    return NextResponse.json({ success: false, error: '반자동 작업 목록 조회에 실패했습니다' }, { status: 500 })
  }
}
