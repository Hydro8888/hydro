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
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-25 dark:bg-gray-950 flex flex-col shrink-0">
      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
        <Link
          href="/chat"
          className="flex items-center gap-2 px-3 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors w-full justify-center shadow-xs ring-1 ring-gray-900/10 dark:ring-white/10"
        >
          <Plus className="w-4 h-4" />
          새 대화
        </Link>
      </div>

      <nav className="p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.endsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 overflow-y-auto px-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider px-3 mb-3">
          최근 대화
        </p>
        {sorted.length === 0 ? (
          <div className="text-center py-10 px-3">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              대화가 없습니다
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              위 &ldquo;새 대화&rdquo;를 눌러 시작하세요
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 pb-4">
            {sorted.map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                title={conv.title}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors group"
              >
                {conv.pinned && (
                  <Pin className="w-3 h-3 text-gray-500 shrink-0" />
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
