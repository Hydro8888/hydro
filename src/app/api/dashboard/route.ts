import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/dashboard - 대시보드 통계
export async function GET() {
  try {
    const user = getCurrentUser()

    const services = await prisma.service.findMany({
      where: { userId: user.id },
      select: { id: true },
    })
    const serviceIds = services.map(s => s.id)

    if (serviceIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          todayAutomated: 0,
          pendingApprovals: 0,
          failedTasks: 0,
          userActionNeeded: 0,
          connectedChannels: 0,
          totalTasks: 0,
        },
      })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      todayAutomated,
      pendingApprovals,
      failedTasks,
      userActionNeeded,
      connectedChannels,
      totalTasks,
    ] = await Promise.all([
      prisma.task.count({
        where: {
          serviceId: { in: serviceIds },
          automationGrade: 'A',
          status: 'COMPLETED',
          completedAt: { gte: today },
        },
      }),
      prisma.approvalRequest.count({
        where: {
          task: { serviceId: { in: serviceIds } },
          status: 'REVIEW_PENDING',
        },
      }),
      prisma.task.count({
        where: {
          serviceId: { in: serviceIds },
          status: 'FAILED',
        },
      }),
      prisma.task.count({
        where: {
          serviceId: { in: serviceIds },
          status: 'USER_ACTION_NEEDED',
        },
      }),
      prisma.channelConnection.count({
        where: {
          serviceId: { in: serviceIds },
          status: 'CONNECTED',
        },
      }),
      prisma.task.count({
        where: { serviceId: { in: serviceIds } },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        todayAutomated,
        pendingApprovals,
        failedTasks,
        userActionNeeded,
        connectedChannels,
        totalTasks,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { success: false, error: '대시보드 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
