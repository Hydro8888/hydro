'use client';

import { useRef, useEffect, useState } from 'react';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useModelStore } from '@/stores/model-store';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { SamplePrompts } from '@/components/dashboard/sample-prompts';
import { ChevronDown } from 'lucide-react';

interface ChatWorkspaceProps {
  conversationId?: string;
  modelIdOverride?: string;
}

export function ChatWorkspace({
  conversationId,
  modelIdOverride,
}: ChatWorkspaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedModelId = useModelStore((s) => s.selectedModelIds[0]);
  const modelId = modelIdOverride ?? selectedModelId;
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
    useChatStream(conversationId, modelIdOverride);

  function scrollToBottom() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 100);
  }

  return (
    <div className="flex flex-col h-full relative">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <SamplePrompts
            onSelectPrompt={(prompt) => {
              handleInputChange({
                target: { value: prompt },
              } as React.ChangeEvent<HTMLTextAreaElement>);
            }}
          />
        ) : (
          <div className="max-w-3xl mx-auto py-4">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                role={message.role as 'user' | 'assistant'}
                content={message.content}
                modelId={message.role === 'assistant' ? modelId : undefined}
                createdAt={message.createdAt?.toString()}
                isStreaming={
                  isLoading &&
                  index === messages.length - 1 &&
                  message.role === 'assistant'
                }
              />
            ))}
          </div>
        )}
      </div>

      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 w-9 h-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors z-10"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      )}

      <ChatInput
        value={input}
        onChange={(val) =>
          handleInputChange({
            target: { value: val },
          } as React.ChangeEvent<HTMLTextAreaElement>)
        }
        onSubmit={() =>
          handleSubmit(new Event('submit') as unknown as React.FormEvent)
        }
        onStop={stop}
        isLoading={isLoading}
      />
    </div>
  );
}
