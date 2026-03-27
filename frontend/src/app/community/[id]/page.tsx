'use client';

import Link from 'next/link';
import { ArrowLeft, MessageCircle, Eye, Heart, Flag } from 'lucide-react';
import { useState } from 'react';

const MOCK_POST = {
  id: '1',
  category: 'TALK',
  title: '강남에서 일하시는 분들 꿀팁 공유해요',
  content: '강남에서 3개월째 일하고 있는데요.\n\n처음에는 긴장도 많이 되고 힘들었는데 이제 좀 적응이 됐어요.\n\n새로 시작하시는 분들께 도움이 될만한 팁들 공유할게요:\n\n1. 첫날은 무조건 일찍 가세요\n2. 선배 언니들한테 잘 대하면 많이 알려줘요\n3. 안전 관련해서는 절대 타협하지 마세요\n\n궁금한 거 있으면 댓글로 물어봐요!',
  nickname: '달빛여우',
  viewCount: 456,
  likeCount: 32,
  createdAt: '2시간 전',
  comments: [
    { id: '1', nickname: '밤하늘별', content: '좋은 정보 감사해요! 저도 이제 시작하는데 도움 많이 됐어요 ☺️', createdAt: '1시간 전' },
    { id: '2', nickname: '꿈나무', content: '3번 진짜 중요!!', createdAt: '45분 전' },
    { id: '3', nickname: '익명', content: '강남 어디쪽이에요? 저도 강남인데~', createdAt: '30분 전', isAnonymous: true },
  ],
};

export default function PostDetailPage() {
  const [comment, setComment] = useState('');

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/community" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> 목록으로
      </Link>

      {/* Post */}
      <article className="rounded-xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">언니들이야기</span>
        </div>
        <h1 className="mb-2 text-xl font-bold">{MOCK_POST.title}</h1>
        <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span>{MOCK_POST.nickname}</span>
          <span>{MOCK_POST.createdAt}</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {MOCK_POST.viewCount}</span>
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{MOCK_POST.content}</div>

        <div className="mt-6 flex items-center gap-4 border-t border-border pt-4">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
            <Heart className="h-4 w-4" /> {MOCK_POST.likeCount}
          </button>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive">
            <Flag className="h-4 w-4" /> 신고
          </button>
        </div>
      </article>

      {/* Comments */}
      <section className="mt-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <MessageCircle className="h-5 w-5 text-primary" />
          댓글 {MOCK_POST.comments.length}
        </h2>

        <div className="space-y-3">
          {MOCK_POST.comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-card p-4">
              <div className="mb-1 flex items-center gap-2 text-sm">
                <span className="font-medium">{c.nickname}</span>
                <span className="text-xs text-muted-foreground">{c.createdAt}</span>
              </div>
              <p className="text-sm text-muted-foreground">{c.content}</p>
            </div>
          ))}
        </div>

        {/* Comment input */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            disabled={!comment.trim()}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-light disabled:opacity-50"
          >
            등록
          </button>
        </div>
      </section>
    </div>
  );
}
