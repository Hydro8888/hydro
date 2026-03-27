'use client';

import { ModelSelector } from '@/components/models/model-selector';
import { ChatWorkspace } from '@/components/chat/chat-workspace';
import { DualPaneChat } from '@/components/chat/dual-pane-chat';
import { MultiPaneChat } from '@/components/chat/multi-pane-chat';
import { ContextPanel } from '@/components/context/context-panel';
import { useModelStore } from '@/stores/model-store';

export default function ChatPage() {
  const mode = useModelStore((s) => s.mode);

  return (
    <div className="flex h-full">
      <ModelSelector />

      <div className="flex-1 min-w-0">
        {mode === 'single' && <ChatWorkspace />}
        {mode === 'dual' && <DualPaneChat />}
        {mode === 'multi' && <MultiPaneChat />}
      </div>

      <ContextPanel />
    </div>
  );
}
