import Link from 'next/link';
import { MessageCircle, ArrowRight } from 'lucide-react';

const BOARDS = [
  { id: 'talk', title: '내 얘기 좀 들어봐', sub: '여성회원 전용', posts: [
    { id: '1', t: '20대 초 대학생인데요', d: '2026-02-22' }, { id: '2', t: '공고성 글로 관리자에 의해 삭제...', d: '2026-01-26' },
    { id: '3', t: '공고성 글로 관리자에 의해 삭제...', d: '2026-01-14' }, { id: '4', t: '어디서 광고보나요?', d: '2026-01-06' },
    { id: '5', t: '77,88,88만 그냥 모르 바주는걸 인건', d: '2025-12-02' },
  ]},
  { id: 'buddy', title: '단짝친구찾기', sub: '여성회원 전용', posts: [
    { id: '6', t: '인천 계양에서 같이 다니실분 ♥', d: '2026-03-27' }, { id: '7', t: '사이즈 안 봐는 곳 ♥♥', d: '2026-03-27' },
    { id: '8', t: '같이 일할분 문의 주세요', d: '2026-01-28' }, { id: '9', t: '매장 알바를 구해야는 친의요...', d: '2026-01-06' },
    { id: '10', t: '어디서 광고보나요??', d: '2026-01-06' },
  ]},
  { id: 'info', title: '밤문화 정보공유', sub: '', posts: [
    { id: '11', t: '고수익알바 사기 사례들', d: '2023-09-07' }, { id: '12', t: '시오남발이 고한빌란 찍인다?', d: '2023-08-07' },
    { id: '13', t: '쉬운데 아가씨는 수입은 얼마인가?', d: '2021-08-30' }, { id: '14', t: '핀러 부분분소 고졸', d: '2021-06-18' },
    { id: '15', t: '힐러 본론조 손님방법 BEST 4', d: '2021-04-05' },
  ]},
  { id: 'news', title: '밤문화 뉴스', sub: '', posts: [
    { id: '16', t: '[예술·관광] 정부 "유흥주점 현행법..."', d: '2025-10-18' }, { id: '17', t: '"유흥업소 종사 1340만 부가세..."', d: '2023-04-26' },
    { id: '18', t: '"유흥업소 영업 17곳만...순반보안 500..."', d: '2022-10-11' }, { id: '19', t: '거리두기 해제에 유흥업 회생한다는 추론...', d: '2022-08-17' },
  ]},
  { id: 'event', title: '여우알바 이벤트', sub: '', posts: [
    { id: '20', t: '[이벤트종료] 수만명참여 무료 공고 이벤트', d: '2020-11-11' },
  ]},
];

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-[#C9A961]" />
        <h1 className="text-xl font-bold">커뮤니티</h1>
        <p className="text-sm text-[#94A3B8]">다양한 정보를을 공유할 수 있는 공간입니다.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {BOARDS.map(board => (
          <div key={board.id} className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1E3A5F]/20 px-4 py-3">
              <div>
                <h2 className="text-sm font-bold">{board.title}</h2>
                {board.sub && <span className="text-[10px] text-[#F59E0B]">{board.sub}</span>}
              </div>
              <Link href={`/community/?board=${board.id}`} className="flex items-center gap-0.5 rounded-lg bg-[#C9A961] px-2.5 py-1 text-[10px] font-semibold text-[#0D1B2A]">
                더보기 <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ul className="divide-y divide-[#1E3A5F]/10">
              {board.posts.map(post => (
                <li key={post.id}>
                  <Link href={`/community/${post.id}/`} className="flex items-center justify-between px-4 py-2.5 transition hover:bg-[#112240]/50">
                    <span className="truncate text-xs text-[#94A3B8] pr-3">{post.t}</span>
                    <span className="shrink-0 text-[10px] text-[#64748B]">{post.d}</span>
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
