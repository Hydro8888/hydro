'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { getModelConfig } from '@ai-portal/shared';
import { Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelId?: string;
  isStreaming?: boolean;
  createdAt?: string;
}

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function MessageBubble({
  role,
  content,
  modelId,
  isStreaming,
  createdAt,
}: MessageBubbleProps) {
  const modelConfig = modelId ? getModelConfig(modelId) : undefined;
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);

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
              onClick={() => {
                navigator.clipboard.writeText(content);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Copy"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Like"
            >
              <ThumbsUp className={cn('w-3.5 h-3.5', feedback === 'like' ? 'text-primary-500' : 'text-gray-400')} />
            </button>
            <button
              onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Dislike"
            >
              <ThumbsDown className={cn('w-3.5 h-3.5', feedback === 'dislike' ? 'text-red-500' : 'text-gray-400')} />
            </button>
            {createdAt && (
              <span className="ml-auto text-[10px] text-gray-400">
                {formatTime(createdAt)}
              </span>
            )}
          </div>
        )}

        {role === 'user' && createdAt && (
          <p className="text-[10px] opacity-70 mt-1 text-right">{formatTime(createdAt)}</p>
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
