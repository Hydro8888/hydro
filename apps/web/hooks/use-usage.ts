'use client';

import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '@/lib/api-url';

export interface UsageData {
  currentPeriod: {
    totalTokens: number;
    totalCost: number;
    limit: number;
    byModel: Array<{
      modelId: string;
      tokens: number;
      cost: number;
    }>;
  };
}

export function useUsage() {
  return useQuery<UsageData>({
    queryKey: ['usage'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/usage'));
      if (!res.ok) throw new Error('Failed to fetch usage');
      return res.json();
    },
    refetchInterval: 30000,
  });
}
