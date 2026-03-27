'use client';

import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { getModelConfig } from '@ai-portal/shared';
import { Copy, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelId?: string;
  isStreaming?: boolean;
}

export function MessageBubble({
  role,
  content,
  modelId,
  isStreaming,
}: MessageBubbleProps) {
  const modelConfig = modelId ? getModelConfig(modelId) : undefined;

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-4',
        role === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      {role === 'assistant' && (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
          style={{ backgroundColor: modelConfig?.color ?? '#6366F1' }}
        >
          AI
        </div>
      )}

      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3',
          role === 'user'
            ? 'bg-primary-500 text-white'
            : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        )}
      >
        {role === 'assistant' && modelConfig && (
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: modelConfig.color }}
            />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {modelConfig.displayName}
            </span>
          </div>
        )}

        <div
          className={cn(
            'prose prose-sm max-w-none',
            role === 'user'
              ? 'prose-invert'
              : 'dark:prose-invert'
          )}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>

        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
        )}

        {role === 'assistant' && !isStreaming && content && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => navigator.clipboard.writeText(content)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Copy"
            >
              <Copy className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Like"
            >
              <ThumbsUp className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Dislike"
            >
              <ThumbsDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {role === 'user' && (
        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
            U
          </span>
        </div>
      )}
    </div>
  );
}
