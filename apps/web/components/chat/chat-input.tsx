'use client';

import { useState, useRef, type KeyboardEvent } from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';
import { useModelStore } from '@/stores/model-store';
import { getModelConfig } from '@ai-portal/shared';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectedModelId = useModelStore((s) => s.selectedModelIds[0]);
  const modelConfig = selectedModelId
    ? getModelConfig(selectedModelId)
    : undefined;

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit();
      }
    }
  }

  function handleInput() {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-3">
          {modelConfig && (
            <div
              className="absolute -top-3 left-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: modelConfig.color }}
            >
              {modelConfig.displayName}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm min-h-[40px] max-h-[200px] pt-2"
          />

          <div className="flex items-center gap-1">
            <button
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Attach file"
            >
              <Paperclip className="w-4 h-4 text-gray-400" />
            </button>
            <button
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Voice input"
            >
              <Mic className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={onSubmit}
              disabled={!value.trim() || isLoading}
              className={cn(
                'p-2 rounded-lg transition-colors',
                value.trim() && !isLoading
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
