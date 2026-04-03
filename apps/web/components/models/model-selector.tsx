'use client';

import { MODEL_CATALOG } from '@ai-portal/shared';
import { useModelStore } from '@/stores/model-store';
import { ModelCard } from './model-card';
import { cn } from '@/lib/utils';

const MODE_OPTIONS = [
  { mode: 'single', label: '단일', max: 1 },
  { mode: 'dual', label: '비교', max: 2 },
  { mode: 'multi', label: '4분할', max: 4 },
] as const;

export function ModelSelector() {
  const { mode, selectedModelIds, setMode, selectModel } = useModelStore();
  const maxModels = mode === 'single' ? 1 : mode === 'dual' ? 2 : 4;

  return (
    <div className="w-56 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col shrink-0 overflow-hidden">
      <div className="p-2.5 border-b border-gray-200 dark:border-gray-800 space-y-2">
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              onClick={() => setMode(opt.mode)}
              className={cn(
                'flex-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
                mode === opt.mode
                  ? 'bg-white dark:bg-gray-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 text-center">
          {selectedModelIds.length}/{maxModels} 선택됨
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {MODEL_CATALOG.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            isSelected={selectedModelIds.includes(model.id)}
            onSelect={() => selectModel(model.id)}
          />
        ))}
      </div>
    </div>
  );
}
