import Link from 'next/link';
import { Star, ThumbsUp } from 'lucide-react';

const REVIEWS = [
  { id: '1', store: '강남 프리미엄 라운지', region: '서울 강남', rating: 5, text: '분위기 좋고 사장님이 잘 챙겨주셔요.', author: '달빛여우', date: '2026-03-20', likes: 12 },
  { id: '2', store: '홍대 감성바', region: '서울 마포', rating: 4, text: '근무 환경이 깔끔하고 급여도 제때 나와요.', author: '밤하늘별', date: '2026-03-18', likes: 8 },
  { id: '3', store: '해운대 클럽', region: '부산', rating: 4, text: '부산 쪽에서는 최고예요. 교통비도 지원해줍니다.', author: '바다소녀', date: '2026-03-15', likes: 5 },
  { id: '4', store: '압구정 VIP', region: '서울 강남', rating: 5, text: '급여가 높고 안전하게 일할 수 있는 곳입니다.', author: '꿈나무', date: '2026-03-12', likes: 15 },
];

export default function ReviewsPage() {
  return (
    <div className="mx-auto max-w-[700px] px-3 py-4">
      <h1 className="text-[18px] font-bold mb-1">광고후기</h1>
      <p className="text-[12px] text-[#888] mb-4">실제 근무 경험을 공유합니다</p>
      <div className="space-y-2">
        {REVIEWS.map(r => (
          <div key={r.id} className="card p-3">
            <div className="flex items-start justify-between">
              <div><h3 className="text-[14px] font-bold">{r.store}</h3><p className="text-[11px] text-[#999]">{r.region}</p></div>
              <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? 'fill-[#C9A961] text-[#C9A961]' : 'text-[#ddd]'}`} />)}</div>
            </div>
            <p className="mt-2 text-[13px] text-[#555]">{r.text}</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#999]">
              <div className="flex gap-3"><span>{r.author}</span><span>{r.date}</span></div>
              <button className="flex items-center gap-0.5 hover:text-[#C9A961]"><ThumbsUp className="h-3 w-3" /> {r.likes}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
