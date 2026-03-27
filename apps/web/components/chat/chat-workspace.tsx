'use client';

import { useRef, useEffect } from 'react';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useModelStore } from '@/stores/model-store';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';

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

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChatStream(conversationId, modelIdOverride);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-500">AI</span>
              </div>
              <h2 className="text-lg font-semibold mb-2">
                AI Portal Pro
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                전세계 TOP 10 LLM 중 원하는 모델을 선택하고
                <br />
                대화를 시작하세요.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-4">
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                role={message.role as 'user' | 'assistant'}
                content={message.content}
                modelId={message.role === 'assistant' ? modelId : undefined}
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
        isLoading={isLoading}
      />
    </div>
  );
}
