'use client';

import { useModelStore } from '@/stores/model-store';
import { ChatWorkspace } from './chat-workspace';

export function DualPaneChat({ conversationId }: { conversationId?: string }) {
  const selectedModelIds = useModelStore((s) => s.selectedModelIds);

  return (
    <div className="flex h-full divide-x divide-gray-200 dark:divide-gray-800">
      <div className="flex-1 min-w-0">
        <ChatWorkspace
          conversationId={conversationId}
          modelIdOverride={selectedModelIds[0]}
        />
      </div>
      {selectedModelIds[1] && (
        <div className="flex-1 min-w-0">
          <ChatWorkspace
            conversationId={conversationId}
            modelIdOverride={selectedModelIds[1]}
          />
        </div>
      )}
    </div>
  );
}
