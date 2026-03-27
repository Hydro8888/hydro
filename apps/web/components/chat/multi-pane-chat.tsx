'use client';

import { useModelStore } from '@/stores/model-store';
import { ChatWorkspace } from './chat-workspace';

export function MultiPaneChat({
  conversationId,
}: {
  conversationId?: string;
}) {
  const selectedModelIds = useModelStore((s) => s.selectedModelIds);

  return (
    <div className="grid grid-cols-2 grid-rows-2 h-full divide-x divide-y divide-gray-200 dark:divide-gray-800">
      {selectedModelIds.map((modelId, index) => (
        <div key={`${modelId}-${index}`} className="min-w-0 min-h-0">
          <ChatWorkspace
            conversationId={conversationId}
            modelIdOverride={modelId}
          />
        </div>
      ))}
    </div>
  );
}
