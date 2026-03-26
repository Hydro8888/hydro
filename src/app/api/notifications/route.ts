import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser()
    const unreadOnly = request.nextUrl.searchParams.get('unreadOnly') === 'true'

    const where: any = { userId: user.id }
    if (unreadOnly) where.read = false

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false },
    })

    return NextResponse.json({
      success: true,
      data: { notifications, unreadCount },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: '알림 조회에 실패했습니다' }, { status: 500 })
  }
}
