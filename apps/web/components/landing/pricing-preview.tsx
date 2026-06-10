import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '무료',
    description: '시작하기에 충분한 모든 기능',
    popular: false,
    features: ['50,000 토큰/월', '3개 기본 모델', '7일 대화 히스토리', '기본 지원'],
    cta: '무료로 시작',
    href: '/chat',
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/월',
    description: '전문가와 파워 유저를 위한 플랜',
    popular: true,
    features: [
      '500,000 토큰/월',
      '10개 모든 프리미엄 모델',
      '무제한 히스토리',
      '멀티모델 비교',
      '우선 지원',
      'API 액세스',
    ],
    cta: 'Pro 시작하기',
    href: '/billing',
  },
  {
    name: 'Team',
    price: '$49',
    period: '/월',
    description: '팀 협업에 최적화',
    popular: false,
    features: [
      '2,000,000 토큰/월',
      '팀 공유 워크스페이스',
      '관리자 대시보드',
      '감사 로그',
      '전담 지원',
    ],
    cta: '팀 시작하기',
    href: '/billing',
  },
];

export function PricingPreview() {
  return (
    <Section
      id="pricing"
      variant="gray"
      eyebrow="요금제"
      title="투명하고 간단한 요금제"
      subtitle="필요한 기능을 선택하고 언제든 업그레이드하세요. 숨겨진 비용 없음."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'relative p-8 rounded-2xl border bg-white dark:bg-gray-900 transition-all',
              plan.popular
                ? 'border-gray-900 dark:border-white shadow-lg'
                : 'border-gray-200 dark:border-gray-800'
            )}
          >
            {plan.popular && (
              <Badge
                variant="primary"
                size="md"
                className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-xs"
              >
                가장 인기
              </Badge>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
                  {plan.price}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {plan.period}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {plan.description}
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300"
                >
                  <div className="shrink-0 w-4 h-4 rounded-full bg-primary-50 dark:bg-primary-950 flex items-center justify-center mt-0.5">
                    <Check className="w-2.5 h-2.5 text-primary-600 dark:text-primary-400" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <Button
              href={plan.href}
              variant={plan.popular ? 'primary' : 'secondary'}
              size="lg"
              className="w-full justify-center"
            >
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>

      {/* Enterprise row */}
      <div className="mt-8 max-w-5xl mx-auto p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Enterprise</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            무제한 토큰 · SSO/SAML · 99.9% SLA · 전담 CSM
          </p>
        </div>
        <Button href="mailto:contact@free.ai.kr" variant="secondary" size="lg">
          기업 문의하기
        </Button>
      </div>
    </Section>
  );
}
