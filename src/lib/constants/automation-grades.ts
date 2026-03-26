import { AutomationGrade, TaskType } from './enums'

// 채널 × 작업 유형별 기본 자동화 등급 매트릭스
// 자동화 정책 엔진에서 이 매트릭스를 기본값으로 사용한다.
export const DEFAULT_AUTOMATION_MATRIX: Record<string, Partial<Record<TaskType, AutomationGrade>>> = {
  // Google Search Console: 대부분 자동
  google_search_console: {
    MONITORING: 'A',
    SEO_OPTIMIZATION: 'B',
    INFO_SYNC: 'A',
  },
  // 네이버 서치어드바이저: 대부분 자동
  naver_search_advisor: {
    MONITORING: 'A',
    SEO_OPTIMIZATION: 'B',
    INFO_SYNC: 'A',
  },
  // Google Business Profile: 혼합
  google_business_profile: {
    CHANNEL_REGISTRATION: 'C',
    PROFILE_UPDATE: 'B',
    REVIEW_RESPONSE: 'B',
    INFO_SYNC: 'A',
    IMAGE_UPDATE: 'B',
    DESCRIPTION_UPDATE: 'B',
  },
  // 네이버 플레이스: 대부분 반자동
  naver_place: {
    CHANNEL_REGISTRATION: 'C',
    PROFILE_UPDATE: 'C',
    REVIEW_RESPONSE: 'B',
    INFO_SYNC: 'C',
    IMAGE_UPDATE: 'C',
  },
  // 네이버 블로그: 승인형
  naver_blog: {
    CONTENT_PUBLISH: 'B',
    SEO_OPTIMIZATION: 'B',
    DESCRIPTION_UPDATE: 'B',
  },
  // Apple App Store: 반자동
  apple_app_store: {
    PROFILE_UPDATE: 'C',
    REVIEW_RESPONSE: 'B',
    IMAGE_UPDATE: 'C',
    DESCRIPTION_UPDATE: 'C',
    SEO_OPTIMIZATION: 'C',
  },
  // Google Play Store: 반자동
  google_play_store: {
    PROFILE_UPDATE: 'C',
    REVIEW_RESPONSE: 'B',
    IMAGE_UPDATE: 'C',
    DESCRIPTION_UPDATE: 'C',
    SEO_OPTIMIZATION: 'C',
  },
  // Instagram: 승인형
  instagram: {
    CONTENT_PUBLISH: 'B',
    PROFILE_UPDATE: 'B',
    IMAGE_UPDATE: 'B',
    DESCRIPTION_UPDATE: 'B',
  },
  // 카카오맵: 반자동
  kakao_map: {
    CHANNEL_REGISTRATION: 'C',
    PROFILE_UPDATE: 'C',
    INFO_SYNC: 'C',
    IMAGE_UPDATE: 'C',
  },
  // YouTube: 승인형
  youtube: {
    CONTENT_PUBLISH: 'B',
    PROFILE_UPDATE: 'B',
    DESCRIPTION_UPDATE: 'B',
    SEO_OPTIMIZATION: 'B',
  },
  // Facebook: 승인형
  facebook: {
    CONTENT_PUBLISH: 'B',
    PROFILE_UPDATE: 'B',
    REVIEW_RESPONSE: 'B',
    DESCRIPTION_UPDATE: 'B',
    CTA_UPDATE: 'B',
  },
  // 네이버 스마트스토어: 반자동
  naver_smart_store: {
    CHANNEL_REGISTRATION: 'C',
    PROFILE_UPDATE: 'C',
    DESCRIPTION_UPDATE: 'C',
    IMAGE_UPDATE: 'C',
    REVIEW_RESPONSE: 'B',
  },
}

// 과도한 자동화 방지: 자동 실행 금지 작업 목록
export const AUTO_EXECUTION_BLOCKED_ACTIONS = [
  'BULK_DELETE',
  'BRAND_STATEMENT_FULL_REPLACE',
  'SENSITIVE_REVIEW_AUTO_RESPONSE',
  'MULTI_CHANNEL_BULK_EDIT',
  'AGGRESSIVE_CONTENT_PUBLISH',
] as const
