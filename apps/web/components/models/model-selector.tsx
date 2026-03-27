'use client';

import { MODEL_CATALOG } from '@ai-portal/shared';
import { useModelStore } from '@/stores/model-store';
import { ModelCard } from './model-card';
import { cn } from '@/lib/utils';

export function ModelSelector() {
  const { mode, selectedModelIds, setMode, selectModel } = useModelStore();

  return (
    <div className="w-56 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col shrink-0 overflow-hidden">
      <div className="p-2.5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
          {(['single', 'dual', 'multi'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
                mode === m
                  ? 'bg-white dark:bg-gray-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {m === 'single' ? '1' : m === 'dual' ? '2' : '4'}
            </button>
          ))}
        </div>
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
