'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MODEL_CATALOG } from '@ai-portal/shared';

export type ChatMode = 'single' | 'dual' | 'multi';

const DEFAULT_MODEL_ID = 'xai/grok-4.3';
const VALID_MODEL_IDS = new Set(MODEL_CATALOG.map((m) => m.id));

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
      selectedModelIds: [DEFAULT_MODEL_ID],

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
      version: 2,
      partialize: (state) => ({ mode: state.mode, selectedModelIds: state.selectedModelIds }),
      // Drop any persisted model IDs that no longer exist in the catalog
      // (e.g. after a model version bump) so the UI never references a dead model.
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<ModelStore>;
        const filtered = (state.selectedModelIds ?? []).filter((id) =>
          VALID_MODEL_IDS.has(id)
        );
        return {
          mode: state.mode ?? 'single',
          selectedModelIds: filtered.length > 0 ? filtered : [DEFAULT_MODEL_ID],
        };
      },
    }
  )
);
