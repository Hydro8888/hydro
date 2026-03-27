'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/history/search-bar';
import { ConversationList } from '@/components/history/conversation-list';

export default function HistoryPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-2xl font-bold mb-1">대화 히스토리</h1>
        <p className="text-sm text-gray-500">
          이전 대화를 검색하고 관리하세요.
        </p>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      <ConversationList conversations={[]} />
    </div>
  );
}
