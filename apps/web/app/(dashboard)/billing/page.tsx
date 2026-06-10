'use client';

import { PricingTable } from '@/components/billing/pricing-table';
import { UsageMeter } from '@/components/billing/usage-meter';
import { useUsage } from '@/hooks/use-usage';
import { useToast } from '@/hooks/use-toast';

export default function BillingPage() {
  const { data } = useUsage();
  const period = data?.currentPeriod;
  const { info } = useToast();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 overflow-y-auto h-full">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-1">
          요금제 & 결제
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          플랜을 업그레이드하여 더 많은 모델과 토큰을 사용하세요
        </p>
      </div>

      {/* Usage Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-xs">
        <UsageMeter
          used={period?.totalTokens ?? 0}
          limit={period?.limit ?? 50000}
          cost={period?.totalCost ?? 0}
        />
      </div>

      <div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            플랜 선택
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            언제든지 업그레이드하거나 취소할 수 있습니다
          </p>
        </div>
        <PricingTable
          currentTier="free"
          comingSoon
          onUpgrade={(tier) => {
            if (tier === 'enterprise') {
              window.location.href = 'mailto:contact@free.ai.kr?subject=Enterprise 플랜 문의';
              return;
            }
            info('결제 시스템 오픈 시 이메일로 알려드릴게요. (현재 준비 중)');
          }}
        />
      </div>
    </div>
  );
}
