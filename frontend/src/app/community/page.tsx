'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Eye, PenSquare } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'TALK', label: '언니들이야기' },
  { id: 'BUDDY', label: '단짝찾기' },
  { id: 'ANONYMOUS', label: '19해요' },
  { id: 'REVIEW', label: '실시간 후기' },
  { id: 'EVENT', label: '이벤트' },
];

const MOCK_POSTS = [
  { id: '1', category: 'TALK', title: '강남에서 일하시는 분들 꿀팁 공유해요', nickname: '달빛여우', commentCount: 23, viewCount: 456, createdAt: '2시간 전', isAnonymous: false },
  { id: '2', category: 'REVIEW', title: '홍대 ○○바 후기 (솔직)', nickname: '밤하늘별', commentCount: 15, viewCount: 312, createdAt: '3시간 전', isAnonymous: false },
  { id: '3', category: 'ANONYMOUS', title: '처음 시작하는데 긴장되네요...', nickname: '익명', commentCount: 42, viewCount: 789, createdAt: '5시간 전', isAnonymous: true },
  { id: '4', category: 'BUDDY', title: '부산 해운대 같이 일할 친구 구해요!', nickname: '바다소녀', commentCount: 8, viewCount: 134, createdAt: '6시간 전', isAnonymous: false },
  { id: '5', category: 'TALK', title: '이번주 면접 후기 올립니다', nickname: '꿈나무', commentCount: 31, viewCount: 567, createdAt: '8시간 전', isAnonymous: false },
  { id: '6', category: 'EVENT', title: '[공지] 3월 이벤트 안내', nickname: '여우알바 운영팀', commentCount: 5, viewCount: 234, createdAt: '1일 전', isAnonymous: false },
];

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all'
    ? MOCK_POSTS
    : MOCK_POSTS.filter((p) => p.category === activeCategory);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">커뮤니티</h1>
        <button className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-light">
          <PenSquare className="h-4 w-4" /> 글쓰기
        </button>
      </div>

      {/* Categories */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm transition-all ${
              activeCategory === cat.id
                ? 'bg-primary text-white'
                : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {filtered.map((post) => (
          <Link
            key={post.id}
            href={`/community/${post.id}`}
            className="block rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {CATEGORIES.find((c) => c.id === post.category)?.label}
              </span>
              {post.isAnonymous && (
                <span className="text-xs text-muted-foreground">🔒</span>
              )}
            </div>
            <h3 className="font-medium">{post.title}</h3>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span>{post.nickname}</span>
              <span>{post.createdAt}</span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> {post.commentCount}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> {post.viewCount}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
