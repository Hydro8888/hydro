'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/history/search-bar';
import { ConversationList } from '@/components/history/conversation-list';
import { apiUrl } from '@/lib/api-url';
import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConversationItem {
  id: string;
  title: string;
  modelIds: string[];
  messageCount: number;
  updatedAt: string;
  pinned: boolean;
}

function groupByDate(conversations: ConversationItem[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthAgo = new Date(today.getTime() - 30 * 86400000);

  const groups: { label: string; items: ConversationItem[] }[] = [
    { label: '오늘', items: [] },
    { label: '어제', items: [] },
    { label: '이번 주', items: [] },
    { label: '이번 달', items: [] },
    { label: '이전', items: [] },
  ];

  for (const conv of conversations) {
    const d = new Date(conv.updatedAt);
    if (d >= today) groups[0].items.push(conv);
    else if (d >= yesterday) groups[1].items.push(conv);
    else if (d >= weekAgo) groups[2].items.push(conv);
    else if (d >= monthAgo) groups[3].items.push(conv);
    else groups[4].items.push(conv);
  }

  return groups.filter((g) => g.items.length > 0);
}

export default function HistoryPage() {
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/api/conversations'))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setConversations(data.conversations ?? []))
      .catch((err) => {
        console.error('[history] Failed to load:', err);
        setConversations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const pinned = conversations.filter((c) => c.pinned);
  const unpinned = conversations.filter((c) => !c.pinned);

  const isSearching = search.trim().length > 0;
  const filtered = isSearching
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  function handleDelete(id: string) {
    fetch(apiUrl(`/api/conversations/${id}`), { method: 'DELETE' }).then(() => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
    });
  }

  function handlePin(id: string) {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      fetch(apiUrl(`/api/conversations/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !conv.pinned }),
      }).then(() => {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
        );
      });
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 overflow-y-auto h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-1">
            대화 히스토리
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            이전 대화를 검색하고 관리하세요
          </p>
        </div>
        <Button href="/chat" variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
          새 대화
        </Button>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      {loading ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center text-sm text-gray-500">
          불러오는 중...
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-16 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            아직 대화 기록이 없습니다
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            첫 대화를 시작하고 AI와 만나보세요
          </p>
          <Button href="/chat" variant="primary" size="lg" leftIcon={<Plus className="w-4 h-4" />}>
            새 대화 시작하기
          </Button>
        </div>
      ) : filtered !== null ? (
        filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center text-sm text-gray-500">
            검색 결과가 없습니다
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <ConversationList
              conversations={filtered}
              onDelete={handleDelete}
              onPin={handlePin}
            />
          </div>
        )
      ) : (
        <div className="space-y-8">
          {pinned.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
                📌 고정됨
              </p>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <ConversationList
                  conversations={pinned}
                  onDelete={handleDelete}
                  onPin={handlePin}
                />
              </div>
            </div>
          )}
          {groupByDate(unpinned).map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
                {group.label}
              </p>
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <ConversationList
                  conversations={group.items}
                  onDelete={handleDelete}
                  onPin={handlePin}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
