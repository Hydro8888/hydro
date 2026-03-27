'use client';

import { ModelSelector } from '@/components/models/model-selector';
import { ChatWorkspace } from '@/components/chat/chat-workspace';
import { DualPaneChat } from '@/components/chat/dual-pane-chat';
import { MultiPaneChat } from '@/components/chat/multi-pane-chat';
import { ContextPanel } from '@/components/context/context-panel';
import { useModelStore } from '@/stores/model-store';

export default function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const mode = useModelStore((s) => s.mode);

  return (
    <div className="flex h-full">
      <ModelSelector />

      <div className="flex-1 min-w-0">
        {mode === 'single' && (
          <ChatWorkspace conversationId={params.conversationId} />
        )}
        {mode === 'dual' && (
          <DualPaneChat conversationId={params.conversationId} />
        )}
        {mode === 'multi' && (
          <MultiPaneChat conversationId={params.conversationId} />
        )}
      </div>

      <ContextPanel />
    </div>
  );
}
