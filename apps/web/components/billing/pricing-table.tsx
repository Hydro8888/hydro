'use client';

import { TIERS, type TierKey } from '@ai-portal/shared';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingTableProps {
  currentTier?: TierKey;
  onUpgrade?: (tier: TierKey) => void;
}

export function PricingTable({ currentTier = 'free', onUpgrade }: PricingTableProps) {
  const tierOrder: TierKey[] = ['free', 'pro', 'team', 'enterprise'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tierOrder.map((key) => {
        const tier = TIERS[key];
        const isCurrent = key === currentTier;
        const isPopular = key === 'pro';

        return (
          <div
            key={key}
            className={cn(
              'relative rounded-2xl border p-6 flex flex-col',
              isPopular
                ? 'border-primary-500 shadow-lg shadow-primary-500/10'
                : 'border-gray-200 dark:border-gray-700'
            )}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">
                인기
              </div>
            )}

            <h3 className="font-bold text-lg">{tier.name}</h3>
            <div className="mt-2 mb-4">
              {tier.priceUsdCents !== null ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    ${(tier.priceUsdCents / 100).toFixed(0)}
                  </span>
                  <span className="text-sm text-gray-500">/월</span>
                </div>
              ) : (
                <span className="text-3xl font-bold">맞춤</span>
              )}
            </div>

            <ul className="space-y-2 flex-1">
              {tier.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onUpgrade?.(key)}
              disabled={isCurrent}
              className={cn(
                'mt-6 w-full py-2.5 rounded-lg text-sm font-medium transition-colors',
                isCurrent
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default'
                  : isPopular
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
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
