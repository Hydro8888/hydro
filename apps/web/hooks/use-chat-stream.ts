'use client';

import { useChat } from '@ai-sdk/react';
import { useModelStore } from '@/stores/model-store';
import { useToastStore } from '@/hooks/use-toast';
import { apiUrl } from '@/lib/api-url';

export function useChatStream(conversationId?: string, modelIdOverride?: string) {
  const selectedModelId = useModelStore((s) => s.selectedModelIds[0]);
  const modelId = modelIdOverride ?? selectedModelId;
  const addToast = useToastStore((s) => s.addToast);

  return useChat({
    api: apiUrl('/api/chat'),
    body: { modelId, conversationId },
    onError: (error) => {
      const msg = error.message?.includes('API key')
        ? 'API 키가 설정되지 않았습니다.'
        : '채팅 응답 중 오류가 발생했습니다.';
      addToast(msg, 'error');
    },
  });
}
