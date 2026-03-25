import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { determineAutomationGrade } from '@/lib/engines/automation-policy'
import { executeTask } from '@/lib/engines/execution'
import { notifyApprovalNeeded } from '@/lib/engines/notification'
import { getInitialTaskStatus } from '@/lib/states/task-state'
import { TaskTypeLabel } from '@/lib/constants/enums'
import type { TaskType } from '@/lib/constants/enums'

// POST /api/tasks/generate - 채널 연결 후 작업 자동 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId, channelConnectionId } = body

    if (!serviceId || !channelConnectionId) {
      return NextResponse.json(
        { success: false, error: 'serviceId와 channelConnectionId가 필요합니다' },
        { status: 400 }
      )
    }

    const connection = await prisma.channelConnection.findUnique({
      where: { id: channelConnectionId },
      include: { channel: true },
    })

    if (!connection) {
      return NextResponse.json(
        { success: false, error: '채널 연결을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 연결 상태 검증: CONNECTED 상태만 작업 생성 허용
    if (connection.status !== 'CONNECTED') {
      return NextResponse.json(
        { success: false, error: `채널이 연결된 상태가 아닙니다 (현재: ${connection.status})` },
        { status: 400 }
      )
    }

    // 해당 채널이 지원하는 작업 유형별로 작업 생성
    const supportedTypes = connection.channel.supportedTaskTypes as string[]
    const createdTasks = []

    for (const taskType of supportedTypes) {
      // 자동화 정책 엔진으로 등급 판정
      const policy = determineAutomationGrade(
        connection.channel.name,
        taskType as TaskType,
      )

      // 등급에 따른 초기 상태 결정
      const initialStatus = getInitialTaskStatus(policy.grade)

      const task = await prisma.task.create({
        data: {
          serviceId,
          channelConnectionId,
          type: taskType as any,
          status: initialStatus,
          automationGrade: policy.grade,
          title: `${connection.channel.displayName} - ${TaskTypeLabel[taskType as TaskType] || taskType}`,
          description: policy.reason,
          payload: {
            channelName: connection.channel.name,
            conditions: policy.conditions,
          },
        },
      })

      // A등급: 자동 실행 트리거 (비동기)
      if (policy.grade === 'A') {
        executeTask(task.id).catch(console.error)
      }

      // B등급: 승인 요청 자동 생성 + 알림
      if (policy.grade === 'B') {
        const approval = await prisma.approvalRequest.create({
          data: {
            taskId: task.id,
            status: 'REVIEW_PENDING',
            draftContent: {
              taskType,
              channelName: connection.channel.displayName,
              description: `${connection.channel.displayName} 채널의 ${TaskTypeLabel[taskType as TaskType] || taskType} 작업`,
            },
            reason: policy.reason,
            riskLevel: connection.channel.riskLevel,
          },
        })
        notifyApprovalNeeded(approval.id).catch(console.error)
      }

      // C등급: 반자동 작업 자동 생성
      if (policy.grade === 'C') {
        await prisma.assistedTask.create({
          data: {
            taskId: task.id,
            status: 'CREATED',
            instructions: `${connection.channel.displayName}에서 ${TaskTypeLabel[taskType as TaskType] || taskType} 작업을 수행해주세요.\n\n조건:\n${policy.conditions.map(c => `- ${c}`).join('\n')}`,
            checklist: policy.conditions.map((c, i) => ({
              id: `check-${i}`,
              label: c,
              completed: false,
            })),
          },
        })
      }

      createdTasks.push({
        taskId: task.id,
        title: task.title,
        type: taskType,
        automationGrade: policy.grade,
        initialStatus,
      })
    }

    // 감사 로그
    await prisma.auditLog.create({
      data: {
        entityType: 'Task',
        entityId: channelConnectionId,
        action: 'GENERATE',
        after: { tasksCreated: createdTasks.length, channelName: connection.channel.name },
      },
    })

    return NextResponse.json({
      success: true,
      data: createdTasks,
    })
  } catch (error) {
    console.error('Task generation error:', error)
    return NextResponse.json(
      { success: false, error: '작업 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}
