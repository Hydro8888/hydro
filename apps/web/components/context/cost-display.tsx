'use client';

import { formatCost } from '@ai-portal/shared';

interface CostDisplayProps {
  costs: Array<{
    modelId: string;
    modelName: string;
    color: string;
    cost: number;
  }>;
}

export function CostDisplay({ costs }: CostDisplayProps) {
  const totalCost = costs.reduce((sum, c) => sum + c.cost, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">이번 대화 비용</span>
        <span className="text-lg font-bold">{formatCost(totalCost)}</span>
      </div>

      {costs.length > 0 && (
        <div className="space-y-2">
          {costs.map((item) => (
            <div
              key={item.modelId}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-600 dark:text-gray-400">
                  {item.modelName}
                </span>
              </div>
              <span className="font-medium">{formatCost(item.cost)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
