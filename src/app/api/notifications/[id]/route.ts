import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notification = await prisma.notification.update({
      where: { id: params.id },
      data: { read: true },
    })

    return NextResponse.json({ success: true, data: notification })
  } catch (error) {
    return NextResponse.json({ success: false, error: '알림 업데이트에 실패했습니다' }, { status: 500 })
  }
}
