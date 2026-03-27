'use client';

import { getModelConfig } from '@ai-portal/shared';
import { cn } from '@/lib/utils';

interface ModelBadgeProps {
  modelId: string;
  size?: 'sm' | 'md';
}

export function ModelBadge({ modelId, size = 'sm' }: ModelBadgeProps) {
  const config = getModelConfig(modelId);
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
      style={{
        backgroundColor: `${config.color}15`,
        color: config.color,
        border: `1px solid ${config.color}30`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.displayName}
    </span>
  );
}
