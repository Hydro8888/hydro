import { DEFAULT_AUTOMATION_MATRIX } from '../constants/automation-grades'
import type { AutomationGrade, TaskType } from '../constants/enums'

// 자동화 정책 엔진: 채널별 작업을 A/B/C 등급으로 나누고 실행 조건 판정
// Phase 1: 채널 × 작업 유형 매트릭스 조회

interface PolicyResult {
  grade: AutomationGrade
  reason: string
  conditions: string[]
}

export function determineAutomationGrade(
  channelName: string,
  taskType: TaskType,
): PolicyResult {
  const channelMatrix = DEFAULT_AUTOMATION_MATRIX[channelName]

  if (!channelMatrix) {
    // 알 수 없는 채널은 기본 B (승인형)
    return {
      grade: 'B',
      reason: '채널에 대한 자동화 정책이 아직 정의되지 않았습니다',
      conditions: ['관리자 승인 필요'],
    }
  }

  const grade = channelMatrix[taskType]

  if (!grade) {
    // 해당 작업 유형에 대한 정책 미정의 → 기본 B
    return {
      grade: 'B',
      reason: '해당 작업 유형에 대한 정책이 정의되지 않았습니다',
      conditions: ['관리자 승인 필요'],
    }
  }

  return {
    grade,
    reason: getGradeReason(grade, channelName, taskType),
    conditions: getGradeConditions(grade),
  }
}

function getGradeReason(
  grade: AutomationGrade,
  channelName: string,
  taskType: string,
): string {
  switch (grade) {
    case 'A':
      return '저위험 작업으로 자동 실행이 안전합니다'
    case 'B':
      return '브랜드 영향 또는 정책 리스크가 있어 승인이 필요합니다'
    case 'C':
      return '공식 자동 연동이 제한적이거나 수동 입력이 필요합니다'
  }
}

function getGradeConditions(grade: AutomationGrade): string[] {
  switch (grade) {
    case 'A':
      return ['사전 승인된 규칙 범위 내', '저위험 작업만']
    case 'B':
      return ['관리자 또는 검수자 승인 필요', '변경 전/후 비교 필수']
    case 'C':
      return ['담당자 직접 실행', '체크리스트 완료 필수', '증빙 자료 필요할 수 있음']
  }
}

// 특정 작업이 과도한 자동화 방지 대상인지 확인
export function isBlockedFromAutoExecution(taskDescription: string): boolean {
  const blockedPatterns = [
    /대량\s*삭제/,
    /전면\s*교체/,
    /전체\s*변경/,
    /동시\s*수정/,
    /일괄\s*삭제/,
  ]

  return blockedPatterns.some(p => p.test(taskDescription))
}
