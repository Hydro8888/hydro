'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Eye, Heart, Flag, MessageCircle } from 'lucide-react';

const POST = {
  title: '강남에서 일하시는 분들 꿀팁 공유해요',
  content: '강남에서 3개월째 일하고 있는데요.\n\n처음에는 긴장도 많이 되고 힘들었는데 이제 좀 적응이 됐어요.\n\n새로 시작하시는 분들께 도움이 될만한 팁들 공유할게요:\n\n1. 첫날은 무조건 일찍 가세요\n2. 선배 언니들한테 잘 대하면 많이 알려줘요\n3. 안전 관련해서는 절대 타협하지 마세요',
  nick: '달빛여우', views: 456, likes: 32, time: '2시간 전',
  comments: [
    { id: '1', nick: '밤하늘별', text: '좋은 정보 감사해요!', time: '1시간 전' },
    { id: '2', nick: '꿈나무', text: '3번 진짜 중요!!', time: '45분 전' },
    { id: '3', nick: '익명', text: '강남 어디쪽이에요?', time: '30분 전' },
  ],
};

export default function PostDetailPage() {
  const [comment, setComment] = useState('');
  return (
    <div className="mx-auto max-w-[700px] px-3 py-4">
      <Link href="/community/" className="inline-flex items-center gap-1 text-[12px] text-[#888] hover:text-[#333] mb-3"><ArrowLeft className="h-3.5 w-3.5" /> 목록으로</Link>
      <article className="card p-4">
        <h1 className="text-[18px] font-bold mb-1">{POST.title}</h1>
        <div className="flex items-center gap-3 text-[12px] text-[#999] mb-3"><span>{POST.nick}</span><span>{POST.time}</span><span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{POST.views}</span></div>
        <div className="whitespace-pre-wrap text-[13px] text-[#555] leading-relaxed">{POST.content}</div>
        <div className="mt-4 pt-3 border-t border-[#eee] flex gap-4">
          <button className="flex items-center gap-1 text-[12px] text-[#999] hover:text-[#E91E63]"><Heart className="h-4 w-4" /> {POST.likes}</button>
          <button className="flex items-center gap-1 text-[12px] text-[#999] hover:text-[#E91E63]"><Flag className="h-4 w-4" /> 신고</button>
        </div>
      </article>
      <section className="mt-4">
        <h2 className="flex items-center gap-1 text-[14px] font-bold mb-2"><MessageCircle className="h-4 w-4 text-[#C9A961]" /> 댓글 {POST.comments.length}</h2>
        <div className="space-y-1.5">{POST.comments.map(c => (
          <div key={c.id} className="card p-3"><div className="flex items-center gap-2 text-[12px] mb-0.5"><span className="font-bold">{c.nick}</span><span className="text-[10px] text-[#ccc]">{c.time}</span></div><p className="text-[12px] text-[#555]">{c.text}</p></div>
        ))}</div>
        <div className="mt-2 flex gap-1.5">
          <input value={comment} onChange={e => setComment(e.target.value)} placeholder="댓글을 입력하세요..." className="flex-1 border border-[#ddd] rounded px-3 py-2 text-[12px] outline-none focus:border-[#1E3A5F]" />
          <button disabled={!comment.trim()} className="btn btn-navy px-4 py-2 disabled:opacity-40">등록</button>
        </div>
      </section>
    </div>
  );
}
