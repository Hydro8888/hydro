import { CHANNEL_CATALOG, type ChannelDefinition } from '../constants/channel-catalog'
import type { ServiceAnalysis, ChannelRecommendation } from '@/types'
import type { GoalType, ServiceType } from '../constants/enums'

// 채널 적합도 엔진: 각 채널에 대해 적합도 점수를 계산
// 가중치: 서비스유형 적합성 30% + 목표 적합성 30% + 자산 준비도 20% + 자동화 가능성 20%

interface FitnessInput {
  serviceType: ServiceType
  analysis: ServiceAnalysis
  goalTypes: GoalType[]
  availableAssets: string[]
}

export function calculateChannelFitness(input: FitnessInput): ChannelRecommendation[] {
  const { serviceType, analysis, goalTypes, availableAssets } = input

  const recommendations: ChannelRecommendation[] = []

  for (const channel of CHANNEL_CATALOG) {
    const serviceScore = calculateServiceTypeFitness(channel, serviceType)
    const goalScore = calculateGoalFitness(channel, goalTypes)
    const assetScore = calculateAssetReadiness(channel, availableAssets)
    const automationScore = calculateAutomationScore(channel)

    const totalScore = Math.round(
      serviceScore * 0.3 +
      goalScore * 0.3 +
      assetScore * 0.2 +
      automationScore * 0.2
    )

    const reasons = generateReasons(channel, serviceType, goalTypes, totalScore)
    const missingItems = findMissingItems(channel, availableAssets)
    const readyNow = missingItems.length === 0 && totalScore >= 40

    // 최소 점수 이상만 추천
    if (totalScore >= 20) {
      recommendations.push({
        channelId: channel.name,
        channelName: channel.name,
        displayName: channel.displayName,
        category: channel.category,
        score: totalScore,
        reasons,
        readyNow,
        missingItems,
        automationGrade: channel.automationCapability,
        riskLevel: channel.riskLevel,
      })
    }
  }

  // 점수 내림차순 정렬
  return recommendations.sort((a, b) => b.score - a.score)
}

function calculateServiceTypeFitness(channel: ChannelDefinition, serviceType: string): number {
  if (channel.suitableServiceTypes.includes(serviceType)) {
    return 100
  }
  // 범용 채널은 부분 점수
  if (channel.suitableServiceTypes.length >= 4) {
    return 50
  }
  return 10
}

function calculateGoalFitness(channel: ChannelDefinition, goalTypes: string[]): number {
  if (goalTypes.length === 0) return 50 // 목표 미설정 시 중립

  const matchCount = goalTypes.filter(g => channel.suitableGoalTypes.includes(g)).length
  return Math.round((matchCount / goalTypes.length) * 100)
}

function calculateAssetReadiness(channel: ChannelDefinition, availableAssets: string[]): number {
  if (channel.requiredAssets.length === 0) return 100

  const haveCount = channel.requiredAssets.filter(a => availableAssets.includes(a)).length
  return Math.round((haveCount / channel.requiredAssets.length) * 100)
}

function calculateAutomationScore(channel: ChannelDefinition): number {
  switch (channel.automationCapability) {
    case 'A': return 100
    case 'B': return 70
    case 'C': return 40
    default: return 50
  }
}

function generateReasons(
  channel: ChannelDefinition,
  serviceType: string,
  goalTypes: string[],
  score: number,
): string[] {
  const reasons: string[] = []

  if (channel.suitableServiceTypes.includes(serviceType)) {
    reasons.push(`${channel.displayName}은(는) 해당 서비스 유형에 적합합니다`)
  }

  const matchedGoals = goalTypes.filter(g => channel.suitableGoalTypes.includes(g))
  if (matchedGoals.length > 0) {
    reasons.push(`설정한 운영 목표와 높은 연관성이 있습니다`)
  }

  if (channel.automationCapability === 'A') {
    reasons.push(`대부분의 작업을 자동으로 실행할 수 있습니다`)
  }

  if (score >= 70) {
    reasons.push(`종합 적합도가 높아 우선 운영을 추천합니다`)
  }

  return reasons
}

function findMissingItems(channel: ChannelDefinition, availableAssets: string[]): string[] {
  return channel.requiredAssets.filter(a => !availableAssets.includes(a))
}
