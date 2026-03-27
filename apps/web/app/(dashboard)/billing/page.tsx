'use client';

import { PricingTable } from '@/components/billing/pricing-table';
import { UsageMeter } from '@/components/billing/usage-meter';

export default function BillingPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 overflow-y-auto h-full">
      <div>
        <h1 className="text-2xl font-bold mb-1">요금제 & 결제</h1>
        <p className="text-sm text-gray-500">
          플랜을 업그레이드하여 더 많은 모델과 토큰을 사용하세요.
        </p>
      </div>

      <UsageMeter used={0} limit={50000} cost={0} />

      <div>
        <h2 className="text-lg font-semibold mb-4">플랜 선택</h2>
        <PricingTable currentTier="free" />
      </div>
    </div>
  );
}
