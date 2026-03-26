import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/tasks?serviceId= - 작업 목록
export async function GET(request: NextRequest) {
  try {
    const serviceId = request.nextUrl.searchParams.get('serviceId')
    const status = request.nextUrl.searchParams.get('status')
    const grade = request.nextUrl.searchParams.get('grade')

    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'serviceId가 필요합니다' },
        { status: 400 }
      )
    }

    const where: any = { serviceId }
    if (status) where.status = status
    if (grade) where.automationGrade = grade

    const tasks = await prisma.task.findMany({
      where,
      include: {
        channelConnection: {
          include: { channel: true },
        },
        approvalRequest: true,
        assistedTask: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    console.error('Task list error:', error)
    return NextResponse.json(
      { success: false, error: '작업 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
