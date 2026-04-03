'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/history/search-bar';
import { ConversationList } from '@/components/history/conversation-list';
import { apiUrl } from '@/lib/api-url';
import { MessageSquare } from 'lucide-react';

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
      .then((res) => res.json())
      .then((data) => setConversations(data.conversations ?? []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  const pinned = conversations.filter((c) => c.pinned);
  const unpinned = conversations.filter((c) => !c.pinned);

  const filtered = search
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
    <div className="p-6 max-w-3xl mx-auto space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-2xl font-bold mb-1">대화 히스토리</h1>
        <p className="text-sm text-gray-500">
          이전 대화를 검색하고 관리하세요.
        </p>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">아직 대화 기록이 없습니다.</p>
          <Link
            href="/chat"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            새 대화 시작하기
          </Link>
        </div>
      ) : filtered !== null ? (
        <ConversationList
          conversations={filtered}
          onDelete={handleDelete}
          onPin={handlePin}
        />
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">📌 고정됨</p>
              <ConversationList
                conversations={pinned}
                onDelete={handleDelete}
                onPin={handlePin}
              />
            </div>
          )}
          {groupByDate(unpinned).map((group) => (
            <div key={group.label}>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                {group.label}
              </p>
              <ConversationList
                conversations={group.items}
                onDelete={handleDelete}
                onPin={handlePin}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
