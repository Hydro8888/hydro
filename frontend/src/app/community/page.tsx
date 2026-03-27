'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Eye, PenSquare } from 'lucide-react';

const CATS = [
  { id: 'all', label: '전체' }, { id: 'TALK', label: '이야기' }, { id: 'BUDDY', label: '단짝' },
  { id: 'ANONYMOUS', label: '19해요' }, { id: 'REVIEW', label: '후기' }, { id: 'EVENT', label: '이벤트' },
];

const POSTS = [
  { id: '1', cat: 'TALK', title: '강남에서 일하시는 분들 꿀팁 공유해요', nick: '달빛여우', comments: 23, views: 456, time: '2시간 전' },
  { id: '2', cat: 'REVIEW', title: '홍대 ○○바 후기 (솔직)', nick: '밤하늘별', comments: 15, views: 312, time: '3시간 전' },
  { id: '3', cat: 'ANONYMOUS', title: '처음 시작하는데 긴장되네요...', nick: '익명', comments: 42, views: 789, time: '5시간 전' },
  { id: '4', cat: 'BUDDY', title: '부산 해운대 같이 일할 친구 구해요!', nick: '바다소녀', comments: 8, views: 134, time: '6시간 전' },
  { id: '5', cat: 'TALK', title: '이번주 면접 후기 올립니다', nick: '꿈나무', comments: 31, views: 567, time: '8시간 전' },
];

export default function CommunityPage() {
  const [cat, setCat] = useState('all');
  const filtered = cat === 'all' ? POSTS : POSTS.filter((p) => p.cat === cat);

  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">커뮤니티</h1>
        <button className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#4a7dff] to-[#7c5cfc] px-4 py-2 text-sm font-medium text-white">
          <PenSquare className="h-4 w-4" /> 글쓰기
        </button>
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {CATS.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`shrink-0 rounded-lg px-3.5 py-2 text-sm transition ${cat === c.id ? 'bg-[#4a7dff] text-white' : 'bg-[#111d35] text-[#7a8ba8] hover:text-white'}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((p) => (
          <Link key={p.id} href={`/community/${p.id}/`} className="glass-sm block px-4 py-3 transition hover:bg-[#1a2a4a]/60">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded bg-[#111d35] px-1.5 py-0.5 text-[10px] text-[#7a8ba8]">{CATS.find((c) => c.id === p.cat)?.label}</span>
            </div>
            <h3 className="text-sm font-medium">{p.title}</h3>
            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[#4a5d7a]">
              <span>{p.nick}</span>
              <span>{p.time}</span>
              <span className="flex items-center gap-0.5"><MessageCircle className="h-3 w-3" />{p.comments}</span>
              <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{p.views}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
