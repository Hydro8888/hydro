'use client';

import { MODEL_CATALOG } from '@ai-portal/shared';
import { useModelStore } from '@/stores/model-store';

/**
 * Compact model picker shown only on mobile, where the full
 * ModelSelector sidebar is hidden. Switches the primary model slot.
 */
export function MobileModelBar() {
  const selectedModelIds = useModelStore((s) => s.selectedModelIds);
  const selectModel = useModelStore((s) => s.selectModel);

  return (
    <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
      <label
        htmlFor="mobile-model-select"
        className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0"
      >
        모델
      </label>
      <select
        id="mobile-model-select"
        value={selectedModelIds[0] ?? ''}
        onChange={(e) => selectModel(e.target.value, 0)}
        className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
      >
        {MODEL_CATALOG.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName} ({m.tier === 'free' ? '무료' : 'Pro'})
          </option>
        ))}
      </select>
    </div>
  );
}
