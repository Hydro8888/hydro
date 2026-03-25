import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canTransitionTask } from '@/lib/states/task-state'
import type { TaskStatus } from '@/lib/constants/enums'

// GET /api/tasks/[id] - 작업 상세
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        channelConnection: {
          include: { channel: true },
        },
        approvalRequest: true,
        assistedTask: true,
      },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: '작업을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '작업 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

// PATCH /api/tasks/[id] - 작업 상태 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status: newStatus, errorReason } = body

    const task = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: '작업을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 상태 전이 검증
    if (!canTransitionTask(task.status as TaskStatus, newStatus as TaskStatus)) {
      return NextResponse.json(
        { success: false, error: `${task.status}에서 ${newStatus}로 전환할 수 없습니다` },
        { status: 400 }
      )
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        ...(errorReason && { errorReason }),
        ...(newStatus === 'COMPLETED' && { completedAt: new Date() }),
        ...(newStatus === 'RETRY_PENDING' && { retryCount: { increment: 1 } }),
      },
    })

    // 감사 로그
    await prisma.auditLog.create({
      data: {
        entityType: 'Task',
        entityId: params.id,
        action: 'STATUS_CHANGE',
        before: { status: task.status },
        after: { status: newStatus, errorReason },
      },
    })

    return NextResponse.json({ success: true, data: updatedTask })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '작업 상태 변경에 실패했습니다' },
      { status: 500 }
    )
  }
}
