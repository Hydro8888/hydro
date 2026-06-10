'use client';

import { formatTokenCount, formatCost } from '@ai-portal/shared';
import { cn } from '@/lib/utils';

interface UsageMeterProps {
  used: number;
  limit: number;
  cost: number;
}

export function UsageMeter({ used, limit, cost }: UsageMeterProps) {
  const percentage = Math.min((used / limit) * 100, 100);

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">이번 달 사용량</h3>
        <span className="text-xs text-gray-400">
          {formatCost(cost)}
        </span>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 mb-2">
        <div
          className={cn(
            'h-3 rounded-full transition-all duration-500',
            percentage > 90
              ? 'bg-red-500'
              : percentage > 70
                ? 'bg-yellow-500'
                : 'bg-primary-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatTokenCount(used)} 사용</span>
        <span>{formatTokenCount(limit)} 한도</span>
      </div>
    </div>
  );
}
