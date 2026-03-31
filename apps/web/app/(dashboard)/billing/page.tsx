'use client';

import { PricingTable } from '@/components/billing/pricing-table';
import { UsageMeter } from '@/components/billing/usage-meter';
import { useUsage } from '@/hooks/use-usage';

export default function BillingPage() {
  const { data } = useUsage();
  const period = data?.currentPeriod;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 overflow-y-auto h-full">
      <div>
        <h1 className="text-2xl font-bold mb-1">요금제 & 결제</h1>
        <p className="text-sm text-gray-500">
          플랜을 업그레이드하여 더 많은 모델과 토큰을 사용하세요.
        </p>
      </div>

      <UsageMeter
        used={period?.totalTokens ?? 0}
        limit={period?.limit ?? 50000}
        cost={period?.totalCost ?? 0}
      />

      <div>
        <h2 className="text-lg font-semibold mb-4">플랜 선택</h2>
        <PricingTable
          currentTier="free"
          onUpgrade={() => {
            alert('결제 시스템은 현재 준비 중입니다.');
          }}
        />
      </div>
    </div>
  );
}
