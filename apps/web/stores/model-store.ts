'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChatMode = 'single' | 'dual' | 'multi';

interface ModelStore {
  mode: ChatMode;
  selectedModelIds: string[];
  setMode: (mode: ChatMode) => void;
  selectModel: (modelId: string, slot?: number) => void;
  removeModel: (slot: number) => void;
  clearModels: () => void;
}

export const useModelStore = create<ModelStore>()(
  persist(
    (set, get) => ({
      mode: 'single',
      selectedModelIds: ['xai/grok-4'],

      setMode: (mode) => {
        const current = get().selectedModelIds;
        const maxModels = mode === 'single' ? 1 : mode === 'dual' ? 2 : 4;
        set({
          mode,
          selectedModelIds: current.slice(0, maxModels),
        });
      },

      selectModel: (modelId, slot) => {
        const { mode, selectedModelIds } = get();
        const maxModels = mode === 'single' ? 1 : mode === 'dual' ? 2 : 4;

        if (slot !== undefined && slot < maxModels) {
          const updated = [...selectedModelIds];
          updated[slot] = modelId;
          set({ selectedModelIds: updated });
        } else if (mode === 'single') {
          set({ selectedModelIds: [modelId] });
        } else if (selectedModelIds.length < maxModels) {
          set({ selectedModelIds: [...selectedModelIds, modelId] });
        }
      },

      removeModel: (slot) => {
        const updated = get().selectedModelIds.filter((_, i) => i !== slot);
        set({ selectedModelIds: updated });
      },

      clearModels: () => set({ selectedModelIds: [] }),
    }),
    {
      name: 'model-store',
      partialize: (state) => ({ mode: state.mode, selectedModelIds: state.selectedModelIds }),
    }
  )
);
