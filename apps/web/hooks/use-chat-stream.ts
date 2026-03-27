'use client';

import { useChat } from '@ai-sdk/react';
import { useModelStore } from '@/stores/model-store';

export function useChatStream(conversationId?: string, modelIdOverride?: string) {
  const selectedModelId = useModelStore((s) => s.selectedModelIds[0]);
  const modelId = modelIdOverride ?? selectedModelId;

  return useChat({
    api: '/api/chat',
    body: { modelId, conversationId },
    onFinish: (_message, { usage }) => {
      if (usage) {
        console.log(
          `[chat] Completed: input=${usage.promptTokens} output=${usage.completionTokens}`
        );
      }
    },
  });
}
