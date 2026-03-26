import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { processApproval } from '@/lib/engines/approval'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const approval = await prisma.approvalRequest.findUnique({
      where: { id: params.id },
      include: {
        task: {
          include: {
            channelConnection: { include: { channel: true } },
            service: true,
          },
        },
        reviewer: true,
      },
    })

    if (!approval) {
      return NextResponse.json({ success: false, error: '승인 요청을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: approval })
  } catch (error) {
    return NextResponse.json({ success: false, error: '승인 조회에 실패했습니다' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action, rejectionReason, revisedContent } = body
    const user = getCurrentUser()

    const result = await processApproval({
      approvalId: params.id,
      action,
      reviewerId: user.id,
      rejectionReason,
      revisedContent,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '승인 처리에 실패했습니다' },
      { status: 400 }
    )
  }
}
