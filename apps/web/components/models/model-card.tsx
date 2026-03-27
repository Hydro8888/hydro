'use client';

import type { ModelConfig } from '@ai-portal/shared';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

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
        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-left',
        isSelected
          ? 'bg-opacity-10'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      )}
      style={
        isSelected
          ? { backgroundColor: `${model.color}12` }
          : undefined
      }
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: model.color }}
      />
      <span className={cn(
        'text-sm truncate flex-1',
        isSelected ? 'font-medium' : 'text-gray-700 dark:text-gray-300'
      )}>
        {model.displayName}
      </span>
      <span className="text-[11px] text-gray-400 shrink-0">
        ${model.pricing.outputPerMillionTokens}
      </span>
      {isSelected && (
        <Check className="w-3.5 h-3.5 shrink-0" style={{ color: model.color }} />
      )}
    </button>
  );
}
