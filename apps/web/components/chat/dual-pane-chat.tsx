'use client';

import { useModelStore } from '@/stores/model-store';
import { ChatWorkspace } from './chat-workspace';

export function DualPaneChat({ conversationId }: { conversationId?: string }) {
  const selectedModelIds = useModelStore((s) => s.selectedModelIds);

  return (
    <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800">
      <div className="flex-1 min-w-0 min-h-[70vh] md:min-h-0">
        <ChatWorkspace
          conversationId={conversationId}
          modelIdOverride={selectedModelIds[0]}
        />
      </div>
      {selectedModelIds[1] && (
        <div className="flex-1 min-w-0 min-h-[70vh] md:min-h-0">
          <ChatWorkspace
            conversationId={conversationId}
            modelIdOverride={selectedModelIds[1]}
          />
        </div>
      )}
    </div>
  );
}
