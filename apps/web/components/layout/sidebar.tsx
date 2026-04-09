'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  History,
  CreditCard,
  Settings,
  Plus,
  Pin,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { apiUrl } from '@/lib/api-url';
import { cn } from '@/lib/utils';
import { MODEL_CATALOG } from '@ai-portal/shared';

const navItems = [
  { href: '/chat', label: '새 대화', icon: MessageSquare },
  { href: '/history', label: '히스토리', icon: History },
  { href: '/billing', label: '요금제', icon: CreditCard },
  { href: '/settings', label: '설정', icon: Settings },
];

interface ConvMeta {
  id: string;
  title: string;
  modelIds: string[];
  pinned: boolean;
  updatedAt: string;
}

function getModelColor(modelId: string): string {
  const m = MODEL_CATALOG.find((m) => m.id === modelId);
  return m?.color ?? '#6366F1';
}

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const [conversations, setConversations] = useState<ConvMeta[]>([]);

  useEffect(() => {
    if (!sidebarOpen) return;
    fetch(apiUrl('/api/conversations'))
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations ?? []))
      .catch((err) => console.error('[sidebar] Failed to load conversations:', err));
  }, [sidebarOpen]);

  if (!sidebarOpen) return null;

  const sorted = [...conversations].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col shrink-0">
      <div className="p-3">
        <Link
          href="/chat"
          className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors w-full justify-center"
        >
          <Plus className="w-4 h-4" />
          새 대화
        </Link>
      </div>

      <nav className="px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.endsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 overflow-y-auto mt-4 px-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">
          최근 대화
        </p>
        {sorted.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400">아직 대화가 없습니다.</p>
            <p className="text-xs text-gray-400">새 대화를 시작해보세요!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sorted.map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                title={conv.title}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
              >
                {conv.pinned && (
                  <Pin className="w-3 h-3 text-primary-400 shrink-0" />
                )}
                {conv.modelIds[0] && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: getModelColor(conv.modelIds[0]) }}
                  />
                )}
                <span className="truncate flex-1">{conv.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
