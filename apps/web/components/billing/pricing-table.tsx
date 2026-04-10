'use client';

import { TIERS, type TierKey } from '@ai-portal/shared';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PricingTableProps {
  currentTier?: TierKey;
  onUpgrade?: (tier: TierKey) => void;
}

export function PricingTable({ currentTier = 'free', onUpgrade }: PricingTableProps) {
  const tierOrder: TierKey[] = ['free', 'pro', 'team', 'enterprise'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {tierOrder.map((key) => {
        const tier = TIERS[key];
        const isCurrent = key === currentTier;
        const isPopular = key === 'pro';

        return (
          <div
            key={key}
            className={cn(
              'relative rounded-2xl border p-6 flex flex-col bg-white dark:bg-gray-900 transition-shadow',
              isPopular
                ? 'border-gray-900 dark:border-white shadow-lg'
                : 'border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-md'
            )}
          >
            {isPopular && (
              <Badge
                variant="primary"
                size="md"
                className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-xs"
              >
                가장 인기
              </Badge>
            )}

            <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-1">
              {tier.name}
            </h3>
            <div className="mb-5">
              {tier.priceUsdCents !== null ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
                    ${(tier.priceUsdCents / 100).toFixed(0)}
                  </span>
                  <span className="text-sm text-gray-500">/월</span>
                </div>
              ) : (
                <span className="text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
                  맞춤
                </span>
              )}
            </div>

            <ul className="space-y-2.5 flex-1 mb-6">
              {tier.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <div className="shrink-0 w-4 h-4 rounded-full bg-primary-50 dark:bg-primary-950 flex items-center justify-center mt-0.5">
                    <Check className="w-2.5 h-2.5 text-primary-600 dark:text-primary-400" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onUpgrade?.(key)}
              disabled={isCurrent}
              className={cn(
                'w-full py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs',
                isCurrent
                  ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 cursor-default'
                  : isPopular
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 ring-1 ring-gray-900/10 dark:ring-white/10'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              {isCurrent ? '현재 플랜' : key === 'enterprise' ? '문의하기' : '업그레이드'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
