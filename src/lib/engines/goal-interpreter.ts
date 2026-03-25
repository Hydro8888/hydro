import { GoalType, ServiceType } from '../constants/enums'
import type { SubGoal } from '@/types'

// 목표 해석 엔진: 사용자의 운영 목표를 실행 가능한 하위 목표로 분해
// Phase 1: 규칙 기반 매핑 테이블. Phase 4에서 AI 기반으로 전환 예정.

interface GoalMapping {
  subGoals: SubGoal[]
}

const GOAL_MAPPINGS: Record<GoalType, GoalMapping> = {
  SIGNUP_INCREASE: {
    subGoals: [
      { id: 'landing-traffic', description: '랜딩 페이지 유입 증가', category: 'traffic' },
      { id: 'trust-improvement', description: '서비스 신뢰도 개선', category: 'trust' },
      { id: 'review-boost', description: '후기/리뷰 보강', category: 'review' },
      { id: 'cta-optimization', description: 'CTA 최적화', category: 'conversion' },
    ],
  },
  APP_INSTALL_INCREASE: {
    subGoals: [
      { id: 'store-visibility', description: '스토어 가시성 개선', category: 'visibility' },
      { id: 'store-conversion', description: '스토어 전환율 개선', category: 'conversion' },
      { id: 'review-management', description: '리뷰 관리 강화', category: 'review' },
      { id: 'aso-optimization', description: 'ASO 최적화', category: 'seo' },
    ],
  },
  SEARCH_TRAFFIC_INCREASE: {
    subGoals: [
      { id: 'search-exposure', description: '검색 노출 개선', category: 'seo' },
      { id: 'ctr-improvement', description: 'CTR 개선', category: 'conversion' },
      { id: 'indexing-check', description: '인덱싱/사이트맵 점검', category: 'technical' },
      { id: 'content-seo', description: '콘텐츠 SEO 강화', category: 'content' },
    ],
  },
  LOCAL_EXPOSURE_INCREASE: {
    subGoals: [
      { id: 'local-registration', description: '로컬 채널 등록', category: 'channel' },
      { id: 'location-completeness', description: '위치 정보 완성도 향상', category: 'data' },
      { id: 'review-response', description: '리뷰 대응 강화', category: 'review' },
      { id: 'local-seo', description: '로컬 SEO 최적화', category: 'seo' },
    ],
  },
  INQUIRY_INCREASE: {
    subGoals: [
      { id: 'contact-exposure', description: '연락처 노출 강화', category: 'visibility' },
      { id: 'channel-description', description: '채널 설명 정비', category: 'content' },
      { id: 'cta-improvement', description: 'CTA 개선', category: 'conversion' },
      { id: 'response-speed', description: '응답 속도 개선', category: 'operation' },
    ],
  },
  BRAND_AWARENESS: {
    subGoals: [
      { id: 'social-presence', description: '소셜 미디어 존재감 확보', category: 'channel' },
      { id: 'content-strategy', description: '콘텐츠 전략 수립', category: 'content' },
      { id: 'brand-consistency', description: '브랜드 일관성 확보', category: 'brand' },
      { id: 'multi-channel', description: '멀티 채널 운영', category: 'channel' },
    ],
  },
  REVIEW_MANAGEMENT: {
    subGoals: [
      { id: 'review-monitoring', description: '리뷰 모니터링 체계 구축', category: 'monitoring' },
      { id: 'positive-response', description: '긍정 리뷰 관리', category: 'review' },
      { id: 'negative-response', description: '부정 리뷰 대응', category: 'review' },
      { id: 'review-generation', description: '리뷰 유도 전략', category: 'growth' },
    ],
  },
  CUSTOM: {
    subGoals: [
      { id: 'custom-analysis', description: '맞춤 분석 필요', category: 'analysis' },
    ],
  },
}

// 서비스 유형에 따른 하위 목표 보정
const SERVICE_TYPE_ADJUSTMENTS: Partial<Record<ServiceType, SubGoal[]>> = {
  LOCAL_BUSINESS: [
    { id: 'map-registration', description: '지도 서비스 등록 완성', category: 'channel' },
    { id: 'business-hours', description: '영업시간 정확성 확보', category: 'data' },
  ],
  MOBILE_APP: [
    { id: 'store-listing', description: '앱 스토어 리스팅 최적화', category: 'seo' },
    { id: 'screenshot-update', description: '스크린샷/프리뷰 업데이트', category: 'content' },
  ],
  ECOMMERCE: [
    { id: 'product-seo', description: '상품 검색 최적화', category: 'seo' },
    { id: 'shopping-channel', description: '쇼핑 채널 입점', category: 'channel' },
  ],
}

export function interpretGoal(
  goalType: GoalType,
  serviceType: ServiceType,
  customDescription?: string
): SubGoal[] {
  const base = GOAL_MAPPINGS[goalType]?.subGoals ?? []
  const adjustments = SERVICE_TYPE_ADJUSTMENTS[serviceType] ?? []

  // 중복 제거 후 병합
  const combined = [...base]
  for (const adj of adjustments) {
    if (!combined.some(s => s.id === adj.id)) {
      combined.push(adj)
    }
  }

  return combined
}
