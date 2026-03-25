import { prisma } from '../db'
import { canTransitionTask } from '../states/task-state'
import { notifyTaskFailed, notifyTaskRetryExhausted } from './notification'
import type { TaskStatus } from '../constants/enums'

// A등급 작업 실행 (Phase 2: mock 실행. 향후 실제 API 연동)
export async function executeTask(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error('작업을 찾을 수 없습니다')

  if (task.status !== 'PENDING') {
    throw new Error(`실행 가능한 상태가 아닙니다: ${task.status}`)
  }

  // PENDING → RUNNING
  if (!canTransitionTask('PENDING', 'RUNNING')) return
  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'RUNNING' },
  })

  // Mock 실행: 80% 성공, 20% 실패
  const success = Math.random() > 0.2

  if (success) {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        result: { mockExecution: true, timestamp: new Date().toISOString() },
      },
    })

    await prisma.auditLog.create({
      data: {
        entityType: 'Task',
        entityId: taskId,
        action: 'EXECUTE_SUCCESS',
        after: { status: 'COMPLETED' },
      },
    })
  } else {
    const reason = '자동 실행 중 오류가 발생했습니다 (mock)'
    await handleTaskFailure(taskId, reason)
  }

  return success
}

// 실패 처리
export async function handleTaskFailure(taskId: string, reason: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error('작업을 찾을 수 없습니다')

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'FAILED',
      errorReason: reason,
    },
  })

  await prisma.auditLog.create({
    data: {
      entityType: 'Task',
      entityId: taskId,
      action: 'EXECUTE_FAILED',
      before: { status: task.status },
      after: { status: 'FAILED', errorReason: reason },
    },
  })

  await notifyTaskFailed(taskId, reason)

  // 재시도 횟수 초과 시 별도 알림
  if (task.retryCount >= task.maxRetries) {
    await notifyTaskRetryExhausted(taskId)
  }
}

// 재시도
export async function retryTask(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error('작업을 찾을 수 없습니다')

  if (task.status !== 'FAILED' && task.status !== 'RETRY_PENDING') {
    throw new Error(`재시도 가능한 상태가 아닙니다: ${task.status}`)
  }

  if (task.retryCount >= task.maxRetries) {
    throw new Error(`최대 재시도 횟수(${task.maxRetries})를 초과했습니다`)
  }

  // 원자적 업데이트: RETRY_PENDING을 거쳐 바로 PENDING으로 전환
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'PENDING',
      retryCount: { increment: 1 },
      errorReason: null,
    },
  })

  await prisma.auditLog.create({
    data: {
      entityType: 'Task',
      entityId: taskId,
      action: 'RETRY',
      after: { retryCount: task.retryCount + 1 },
    },
  })
}
