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
  const isFree = model.pricing.outputPerMillionTokens === 0;
  const tooltip = `${model.displayName} — $${model.pricing.inputPerMillionTokens}/$${model.pricing.outputPerMillionTokens} per M tokens`;

  return (
    <button
      onClick={onSelect}
      title={tooltip}
      className={cn(
        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-left',
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
      {isFree ? (
        <span className="text-[10px] font-medium text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 px-1.5 py-0.5 rounded-full shrink-0">
          Free
        </span>
      ) : (
        <span className="text-[11px] text-gray-400 shrink-0">
          ${model.pricing.outputPerMillionTokens}
        </span>
      )}
      {isSelected && (
        <Check className="w-3.5 h-3.5 shrink-0" style={{ color: model.color }} />
      )}
    </button>
  );
}
