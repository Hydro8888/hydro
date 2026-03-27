'use client';

import { formatTokenCount } from '@ai-portal/shared';
import { cn } from '@/lib/utils';

interface TokenCounterProps {
  inputTokens: number;
  outputTokens: number;
  limit: number;
}

export function TokenCounter({
  inputTokens,
  outputTokens,
  limit,
}: TokenCounterProps) {
  const totalTokens = inputTokens + outputTokens;
  const percentage = Math.min((totalTokens / limit) * 100, 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">토큰 사용량</span>
        <span className="text-xs text-gray-400">
          {formatTokenCount(totalTokens)} / {formatTokenCount(limit)}
        </span>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            percentage > 90
              ? 'bg-red-500'
              : percentage > 70
                ? 'bg-yellow-500'
                : 'bg-primary-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-2">
          <p className="text-[10px] text-blue-500 font-medium">INPUT</p>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            {formatTokenCount(inputTokens)}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-2">
          <p className="text-[10px] text-green-500 font-medium">OUTPUT</p>
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
            {formatTokenCount(outputTokens)}
          </p>
        </div>
      </div>
    </div>
  );
}
