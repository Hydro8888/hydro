'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Eye, Heart, Flag, MessageCircle } from 'lucide-react';

const POST = {
  title: '강남에서 일하시는 분들 꿀팁 공유해요',
  content: '강남에서 3개월째 일하고 있는데요.\n\n처음에는 긴장도 많이 되고 힘들었는데 이제 좀 적응이 됐어요.\n\n새로 시작하시는 분들께 도움이 될만한 팁들 공유할게요:\n\n1. 첫날은 무조건 일찍 가세요\n2. 선배 언니들한테 잘 대하면 많이 알려줘요\n3. 안전 관련해서는 절대 타협하지 마세요\n\n궁금한 거 있으면 댓글로 물어봐요!',
  nick: '달빛여우', views: 456, likes: 32, time: '2시간 전',
  comments: [
    { id: '1', nick: '밤하늘별', text: '좋은 정보 감사해요! 저도 이제 시작하는데 도움됐어요', time: '1시간 전' },
    { id: '2', nick: '꿈나무', text: '3번 진짜 중요!!', time: '45분 전' },
    { id: '3', nick: '익명', text: '강남 어디쪽이에요? 저도 강남인데~', time: '30분 전' },
  ],
};

export default function PostDetailPage() {
  const [comment, setComment] = useState('');
  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <Link href="/community/" className="mb-3 inline-flex items-center gap-1 text-sm text-[#9a8aa8] hover:text-white"><ArrowLeft className="h-4 w-4" /> 목록</Link>
      <article className="card p-5">
        <h1 className="mb-2 text-lg font-bold">{POST.title}</h1>
        <div className="mb-4 flex items-center gap-3 text-sm text-[#9a8aa8]"><span>{POST.nick}</span><span>{POST.time}</span><span className="flex items-center gap-1"><Eye className="h-3 w-3" />{POST.views}</span></div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#9a8aa8]">{POST.content}</div>
        <div className="mt-5 flex gap-4 border-t border-[#2a1e3a] pt-4">
          <button className="flex items-center gap-1 text-sm text-[#9a8aa8] hover:text-[#e85d8a]"><Heart className="h-4 w-4" /> {POST.likes}</button>
          <button className="flex items-center gap-1 text-sm text-[#9a8aa8] hover:text-[#ff6b6b]"><Flag className="h-4 w-4" /> 신고</button>
        </div>
      </article>
      <section className="mt-5">
        <h2 className="mb-3 flex items-center gap-1.5 font-semibold"><MessageCircle className="h-4 w-4 text-[#e85d8a]" /> 댓글 {POST.comments.length}</h2>
        <div className="space-y-2">
          {POST.comments.map(c => (
            <div key={c.id} className="card-sm p-3">
              <div className="mb-1 flex items-center gap-2 text-sm"><span className="font-medium">{c.nick}</span><span className="text-[10px] text-[#6a5a7a]">{c.time}</span></div>
              <p className="text-sm text-[#9a8aa8]">{c.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input value={comment} onChange={e => setComment(e.target.value)} placeholder="댓글을 입력하세요..." className="card-sm flex-1 px-3.5 py-2.5 text-sm outline-none placeholder:text-[#6a5a7a]" />
          <button disabled={!comment.trim()} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-40">등록</button>
        </div>
      </section>
    </div>
  );
}
