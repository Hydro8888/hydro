'use client';

import { useQuery } from '@tanstack/react-query';
import type { ModelConfig } from '@ai-portal/shared';

export function useModels() {
  return useQuery<ModelConfig[]>({
    queryKey: ['models'],
    queryFn: async () => {
      const res = await fetch('/api/models');
      if (!res.ok) throw new Error('Failed to fetch models');
      const data = await res.json();
      return data.models;
    },
  });
}
