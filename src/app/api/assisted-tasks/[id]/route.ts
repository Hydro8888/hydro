import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { canTransitionAssistedTask } from '@/lib/states/assisted-task-state'
import { canTransitionTask } from '@/lib/states/task-state'
import { notifyAssistedTaskAssigned, notifyAssistedTaskCompleted } from '@/lib/engines/notification'
import type { AssistedTaskStatus } from '@/lib/constants/enums'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assisted = await prisma.assistedTask.findUnique({
      where: { id: params.id },
      include: {
        task: {
          include: {
            channelConnection: { include: { channel: true } },
            service: true,
          },
        },
        assignee: true,
      },
    })

    if (!assisted) {
      return NextResponse.json({ success: false, error: '반자동 작업을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: assisted })
  } catch (error) {
    return NextResponse.json({ success: false, error: '반자동 작업 조회에 실패했습니다' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status: newStatus, assigneeId, checklist, evidenceUrls } = body

    const assisted = await prisma.assistedTask.findUnique({
      where: { id: params.id },
      include: { task: true },
    })

    if (!assisted) {
      return NextResponse.json({ success: false, error: '반자동 작업을 찾을 수 없습니다' }, { status: 404 })
    }

    const updateData: any = {}

    // 담당자 배정
    if (assigneeId !== undefined) {
      updateData.assigneeId = assigneeId
    }

    // 체크리스트 업데이트
    if (checklist !== undefined) {
      updateData.checklist = checklist
    }

    // 증빙 URL 추가
    if (evidenceUrls !== undefined) {
      updateData.evidenceUrls = evidenceUrls
    }

    // 상태 변경
    if (newStatus && newStatus !== assisted.status) {
      if (!canTransitionAssistedTask(assisted.status as AssistedTaskStatus, newStatus as AssistedTaskStatus)) {
        return NextResponse.json(
          { success: false, error: `${assisted.status}에서 ${newStatus}로 전환할 수 없습니다` },
          { status: 400 }
        )
      }
      updateData.status = newStatus

      if (newStatus === 'COMPLETED') {
        updateData.completedAt = new Date()
        // 작업 상태도 COMPLETED로 cascading
        if (canTransitionTask(assisted.task.status as any, 'COMPLETED')) {
          await prisma.task.update({
            where: { id: assisted.taskId },
            data: { status: 'COMPLETED', completedAt: new Date() },
          })
        }
      }
    }

    const updated = await prisma.assistedTask.update({
      where: { id: params.id },
      data: updateData,
      include: {
        task: { include: { channelConnection: { include: { channel: true } } } },
        assignee: true,
      },
    })

    // 감사 로그
    await prisma.auditLog.create({
      data: {
        entityType: 'AssistedTask',
        entityId: params.id,
        action: newStatus ? 'STATUS_CHANGE' : 'UPDATE',
        before: { status: assisted.status },
        after: updateData,
      },
    })

    // 알림
    if (newStatus === 'ASSIGNED' && assigneeId) {
      await notifyAssistedTaskAssigned(params.id)
    }
    if (newStatus === 'REVIEW_PENDING') {
      await notifyAssistedTaskCompleted(params.id)
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '반자동 작업 업데이트에 실패했습니다' },
      { status: 400 }
    )
  }
}
