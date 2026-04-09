import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '무료',
    popular: false,
    features: ['50,000 토큰/월', '3개 모델', '7일 히스토리'],
    cta: '무료로 시작',
    href: '/chat',
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/월',
    popular: true,
    features: ['500,000 토큰/월', '10개 모든 모델', '무제한 히스토리', '우선 지원'],
    cta: 'Pro 시작하기',
    href: '/billing',
  },
  {
    name: 'Team',
    price: '$49',
    period: '/월',
    popular: false,
    features: ['2,000,000 토큰/월', '팀 공유', '관리자 대시보드', 'API 액세스'],
    cta: '팀 시작하기',
    href: '/billing',
  },
];

export function PricingPreview() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            투명한 요금제
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            필요한 만큼만, 부담 없이
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative p-6 rounded-2xl border bg-white dark:bg-gray-900 transition-all',
                plan.popular
                  ? 'border-primary-500 shadow-lg shadow-primary-500/10 md:scale-[1.05]'
                  : 'border-gray-200 dark:border-gray-800'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500 text-white text-xs font-semibold rounded-full">
                  가장 인기
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={cn(
                  'block w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-all',
                  plan.popular
                    ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Enterprise */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div>
            <h3 className="font-semibold">Enterprise</h3>
            <p className="text-sm text-gray-500">무제한 토큰, SSO, 전담 지원, 99.9% SLA</p>
          </div>
          <a
            href="mailto:contact@free.ai.kr"
            className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
          >
            기업 문의하기
          </a>
        </div>
      </div>
    </section>
  );
}
