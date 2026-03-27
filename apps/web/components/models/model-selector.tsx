'use client';

import { MODEL_CATALOG } from '@ai-portal/shared';
import { useModelStore } from '@/stores/model-store';
import { ModelCard } from './model-card';
import { cn } from '@/lib/utils';

export function ModelSelector() {
  const { mode, selectedModelIds, setMode, selectModel } = useModelStore();

  return (
    <div className="w-72 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col shrink-0 overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold mb-2">모델 선택</h2>
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
          {(['single', 'dual', 'multi'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                mode === m
                  ? 'bg-white dark:bg-gray-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {m === 'single' ? '싱글' : m === 'dual' ? '듀얼' : '멀티'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">
            인기 모델
          </p>
          {MODEL_CATALOG.filter((m) => m.tags.includes('popular')).map(
            (model) => (
              <ModelCard
                key={model.id}
                model={model}
                isSelected={selectedModelIds.includes(model.id)}
                onSelect={() => selectModel(model.id)}
              />
            )
          )}
        </div>

        <div className="mb-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">
            특화 모델
          </p>
          {MODEL_CATALOG.filter(
            (m) => !m.tags.includes('popular') && !m.tags.includes('economy')
          ).map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              isSelected={selectedModelIds.includes(model.id)}
              onSelect={() => selectModel(model.id)}
            />
          ))}
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-2">
            가격 효율 모델
          </p>
          {MODEL_CATALOG.filter((m) => m.tags.includes('economy')).map(
            (model) => (
              <ModelCard
                key={model.id}
                model={model}
                isSelected={selectedModelIds.includes(model.id)}
                onSelect={() => selectModel(model.id)}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
