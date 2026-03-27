'use client';

import Link from 'next/link';
import { MessageSquare, Trash2, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function ConversationList({
  conversations,
  onDelete,
  onPin,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500">대화 기록이 없습니다</p>
        <p className="text-xs text-gray-400 mt-1">
          새 대화를 시작해보세요
        </p>
      </div>
    );
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
              <h3 className="font-medium text-sm truncate">{conv.title}</h3>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>{conv.messageCount}개 메시지</span>
              <span>
                {new Date(conv.updatedAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.preventDefault();
                onPin?.(conv.id);
              }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Pin className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete?.(conv.id);
              }}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950 rounded"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
}
