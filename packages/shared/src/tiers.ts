export type TierKey = 'free' | 'pro' | 'team' | 'enterprise';

export interface TierConfig {
  key: TierKey;
  name: string;
  monthlyTokens: number;
  modelLimit: number;
  historyDays: number | null;
  priceUsdCents: number | null;
  features: string[];
}

export const TIERS: Record<TierKey, TierConfig> = {
  free: {
    key: 'free',
    name: 'Free',
    monthlyTokens: 50_000,
    modelLimit: 3,
    historyDays: 7,
    priceUsdCents: 0,
    features: [
      '50,000 토큰/월',
      '3개 기본 모델',
      '7일 히스토리',
      '싱글 모드만',
    ],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    monthlyTokens: 500_000,
    modelLimit: 10,
    historyDays: null,
    priceUsdCents: 1900,
    features: [
      '500,000 토큰/월',
      '전체 10개 모델',
      '무제한 히스토리',
      '멀티모드 비교',
      '우선 지원',
    ],
  },
  team: {
    key: 'team',
    name: 'Team',
    monthlyTokens: 2_000_000,
    modelLimit: 10,
    historyDays: null,
    priceUsdCents: 4900,
    features: [
      '2M 토큰/월',
      '팀 공유 워크스페이스',
      '관리자 대시보드',
      '우선 지원',
      'API 액세스',
    ],
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    monthlyTokens: Infinity,
    modelLimit: 10,
    historyDays: null,
    priceUsdCents: null,
    features: [
      '무제한 토큰',
      'SSO/SAML',
      '감사 로그',
      '전담 CSM',
      'SLA 99.9%',
    ],
  },
};

export function canAccessModel(tier: TierKey, modelTier: 'free' | 'pro'): boolean {
  if (modelTier === 'free') return true;
  return tier !== 'free';
}
