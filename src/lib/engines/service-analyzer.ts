import { ServiceType } from '../constants/enums'
import type { ServiceAnalysis } from '@/types'

// 서비스 분석 엔진: 서비스 정보와 자산을 분석해 특성 판단
// Phase 1: URL 패턴 + 서비스 유형 기반 규칙

interface AnalysisInput {
  url?: string | null
  appUrl?: string | null
  type: ServiceType
  description: string
  assetTypes: string[] // 현재 보유한 자산 유형 목록
}

export function analyzeService(input: AnalysisInput): ServiceAnalysis {
  const { url, appUrl, type, description, assetTypes } = input

  // 로컬 비즈니스 판별
  const isLocal = type === 'LOCAL_BUSINESS' ||
    /매장|가게|식당|카페|병원|학원|미용|부동산|약국/.test(description)

  // 앱 기반 서비스 판별
  const isApp = type === 'MOBILE_APP' ||
    !!appUrl ||
    /앱|app|플레이스토어|앱스토어/.test(description.toLowerCase())

  // B2B 판별
  const isB2B = type === 'SAAS' ||
    /B2B|기업|솔루션|엔터프라이즈|API|SaaS/.test(description)

  // 필수 채널 도출
  const requiredChannels = deriveRequiredChannels(type, isLocal, isApp, isB2B)

  // 부족 자산 도출
  const missingAssets = deriveMissingAssets(type, assetTypes, isLocal, isApp)

  return {
    isLocal,
    isApp,
    isB2B,
    requiredChannels,
    missingAssets,
  }
}

function deriveRequiredChannels(
  type: ServiceType,
  isLocal: boolean,
  isApp: boolean,
  isB2B: boolean,
): string[] {
  const channels: string[] = []

  // 모든 서비스에 공통
  channels.push('google_search_console')
  channels.push('naver_search_advisor')

  // 로컬 비즈니스
  if (isLocal) {
    channels.push('google_business_profile')
    channels.push('naver_place')
    channels.push('kakao_map')
  }

  // 앱 기반
  if (isApp) {
    channels.push('apple_app_store')
    channels.push('google_play_store')
  }

  // 이커머스
  if (type === 'ECOMMERCE') {
    channels.push('naver_smart_store')
  }

  // 소셜 미디어는 대부분에 추천
  if (!isB2B) {
    channels.push('instagram')
    channels.push('facebook')
  }

  // 콘텐츠/SEO
  if (type === 'WEB_SERVICE' || type === 'CONTENT_PLATFORM' || type === 'ECOMMERCE') {
    channels.push('naver_blog')
  }

  return channels.filter((ch, i) => channels.indexOf(ch) === i)
}

function deriveMissingAssets(
  type: ServiceType,
  currentAssets: string[],
  isLocal: boolean,
  isApp: boolean,
): string[] {
  const needed: string[] = ['LOGO', 'TEXT']

  if (isLocal || isApp || type === 'ECOMMERCE') {
    needed.push('IMAGE')
  }

  if (isApp) {
    needed.push('IMAGE') // 스크린샷
  }

  if (isLocal) {
    needed.push('DOCUMENT') // 사업자 등록증 등
  }

  const unique = needed.filter((n, i) => needed.indexOf(n) === i)
  return unique.filter(a => !currentAssets.includes(a))
}
