import Link from 'next/link';
import { MessageCircle, ArrowRight } from 'lucide-react';

const BOARDS = [
  { id: 'talk', title: '내 얘기 좀 들어봐', sub: '여성회원전용', posts: [{ t: '20대 초 대학생인데요', d: '2026-02-22' }, { t: '공고성 글 관리자에 의해 삭제', d: '2026-01-26' }, { t: '어디서 광고보나요?', d: '2026-01-06' }, { t: '77,88만 그냥 바주는걸', d: '2025-12-02' }, { t: '아직도 번들 5', d: '2025-11-13' }] },
  { id: 'buddy', title: '단짝친구찾기', sub: '여성회원전용', posts: [{ t: '인천 계양에서 같이 다니실분 ♥', d: '2026-03-27' }, { t: '사이즈 안 봐는 곳 ♥♥', d: '2026-03-27' }, { t: '같이 일할분 문의주세요', d: '2026-01-28' }, { t: '매장 알바를 구해야하는데', d: '2026-01-14' }, { t: '나글교이따~', d: '2025-09-22' }] },
  { id: 'info', title: '밤문화 정보공유', posts: [{ t: '고수익알바 사기 사례들', d: '2023-09-07' }, { t: '시오남발이 고한빌란?', d: '2023-08-07' }, { t: '쉬운데 수입은 얼마?', d: '2021-08-30' }, { t: '힐러 부분분소', d: '2021-06-18' }, { t: '손님방법 BEST 4', d: '2021-04-05' }] },
  { id: 'news', title: '밤문화 뉴스', posts: [{ t: '정부 "유흥주점 현행법..."', d: '2025-10-18' }, { t: '유흥업소 1340만 부가세', d: '2023-04-26' }, { t: '유흥업소 영업 17곳만', d: '2022-10-11' }, { t: '거리두기 해제 유흥업', d: '2022-08-17' }] },
  { id: 'event', title: '여우알바 이벤트', posts: [{ t: '[이벤트종료] 수만명참여 무료 공고', d: '2020-11-11' }] },
];

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-[960px] px-4 py-5">
      <div className="flex items-center gap-2 mb-5">
        <MessageCircle className="h-5 w-5 text-[#C9A961]" />
        <h1 className="text-xl font-bold">커뮤니티</h1>
        <p className="text-sm text-[#999]">다양한 정보를 공유할 수 있는 공간입니다</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {BOARDS.map(b => (
          <div key={b.id} className="card overflow-hidden">
            <div className="flex items-center justify-between bg-[#f7f8fa] border-b border-[#e0e0e0] px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">{b.title}</h2>
                {b.sub && <span className="text-xs text-[#E91E63] font-medium">{b.sub}</span>}
              </div>
              <Link href={`/community/?board=${b.id}`} className="btn btn-navy px-3 py-1 text-xs">더보기+</Link>
            </div>
            <ul>
              {b.posts.map((p, i) => (
                <li key={i} className="border-b border-[#f0f0f0] last:border-0">
                  <Link href={`/community/${b.id}-${i}/`} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[#f7f8fa]">
                    <span className="truncate text-[#666] pr-3">{p.t}</span>
                    <span className="shrink-0 text-xs text-[#999]">{p.d}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
