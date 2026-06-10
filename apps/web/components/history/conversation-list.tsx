'use client';

import Link from 'next/link';
import { Pin, Trash2 } from 'lucide-react';
import { MODEL_CATALOG } from '@ai-portal/shared';

interface ConversationItem {
  id: string;
  title: string;
  modelIds: string[];
  messageCount: number;
  updatedAt: string;
  pinned: boolean;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  onDelete?: (id: string) => void;
  onPin?: (id: string) => void;
}

function getModelColor(modelId: string): string {
  const m = MODEL_CATALOG.find((m) => m.id === modelId);
  return m?.color ?? '#6366F1';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

export function ConversationList({
  conversations,
  onDelete,
  onPin,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <Link
          key={conv.id}
          href={`/chat/${conv.id}`}
          className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {conv.pinned && (
                <Pin className="w-3 h-3 text-primary-500 shrink-0" />
              )}
              {conv.modelIds[0] && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: getModelColor(conv.modelIds[0]) }}
                />
              )}
              <h3 className="font-medium text-sm truncate">{conv.title}</h3>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>{conv.messageCount}개 메시지</span>
              <span>{relativeTime(conv.updatedAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.preventDefault();
                onPin?.(conv.id);
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title={conv.pinned ? '고정 해제' : '고정'}
              aria-label={conv.pinned ? '대화 고정 해제' : '대화 고정'}
            >
              <Pin className={`w-3.5 h-3.5 ${conv.pinned ? 'text-primary-500' : 'text-gray-400'}`} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete?.(conv.id);
              }}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950 rounded"
              title="삭제"
              aria-label="대화 삭제"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
}
