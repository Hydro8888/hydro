'use client';

import type { ModelConfig } from '@ai-portal/shared';
import { formatTokenCount } from '@ai-portal/shared';
import { cn } from '@/lib/utils';
import { Check, Zap } from 'lucide-react';

interface ModelCardProps {
  model: ModelConfig;
  isSelected: boolean;
  onSelect: () => void;
}

export function ModelCard({ model, isSelected, onSelect }: ModelCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-3 rounded-xl border-2 transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        isSelected
          ? 'border-current bg-opacity-5'
          : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
      )}
      style={
        isSelected
          ? {
              borderColor: model.color,
              backgroundColor: `${model.color}08`,
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
          style={{ backgroundColor: model.color }}
        >
          {model.displayName.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {model.displayName}
            </span>
            {isSelected && (
              <Check className="w-3.5 h-3.5 shrink-0" style={{ color: model.color }} />
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {model.description}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>${model.pricing.outputPerMillionTokens}/M</span>
            <span className="flex items-center gap-0.5">
              <Zap className="w-3 h-3" />
              {formatTokenCount(model.maxContextTokens)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mt-2 flex-wrap">
        {model.tags.map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] text-gray-500 dark:text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}
