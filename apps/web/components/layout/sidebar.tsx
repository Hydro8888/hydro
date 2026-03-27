'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  History,
  CreditCard,
  Settings,
  Plus,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { useChatStore } from '@/stores/chat-store';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/chat', label: '새 대화', icon: MessageSquare },
  { href: '/history', label: '히스토리', icon: History },
  { href: '/billing', label: '요금제', icon: CreditCard },
  { href: '/settings', label: '설정', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const conversations = useChatStore((s) => s.conversations);

  if (!sidebarOpen) return null;

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
          const isActive = pathname === item.href;
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
        {conversations.length === 0 ? (
          <p className="text-xs text-gray-400 px-3">대화가 없습니다</p>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg truncate transition-colors"
              >
                {conv.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
