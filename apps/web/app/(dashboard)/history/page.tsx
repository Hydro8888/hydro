'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/history/search-bar';
import { ConversationList } from '@/components/history/conversation-list';
import { apiUrl } from '@/lib/api-url';

interface ConversationItem {
  id: string;
  title: string;
  modelIds: string[];
  messageCount: number;
  updatedAt: string;
  pinned: boolean;
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

  const filtered = search
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

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
      ) : (
        <ConversationList
          conversations={filtered}
          onDelete={(id) => {
            fetch(apiUrl(`/api/conversations/${id}`), { method: 'DELETE' }).then(() => {
              setConversations((prev) => prev.filter((c) => c.id !== id));
            });
          }}
          onPin={(id) => {
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
          }}
        />
      )}
    </div>
  );
}
