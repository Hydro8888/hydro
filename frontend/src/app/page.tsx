'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Star, Gem, Trophy, MapPin, ArrowRight, Shield } from 'lucide-react';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const SUB_REGIONS: Record<string, string[]> = { '서울': ['강남', '서초', '송파', '강서', '마포', '홍대', '이태원', '잠실', '신림', '건대'], '부산': ['해운대', '서면', '남포동'], '대구': ['동성로', '수성구'] };

const VVIP = [
  { id: 'v1', name: '전국유일 24시간', region: '수원 영통', desc: '주간 야간 모두 가능!', tc: 130000, type: '노래방' },
  { id: 'v2', name: '2시간240만', region: '강남 역삼', desc: '수수료없음! 당일지급', tc: 200000, type: '퍼트' },
  { id: 'v3', name: '파트너', region: '강남 신논현', desc: '피벗터카리하고 주수5분!', tc: 160000, type: '라운지' },
  { id: 'v4', name: '주간에도 일합니다', region: '강남 역삼', desc: '주간영업 24시 운영!', tc: 150000, type: '바' },
];

const PREMIUM = [
  { id: 'p1', name: '강남알바', region: '강남', desc: '강남 46거리500만바부근200...', tc: 70000, type: '노래방' },
  { id: 'p2', name: '송파 가락', region: '송파 가락', desc: '송파가락지역1000설 분에이7...', tc: 150000, type: '노래방' },
  { id: 'p3', name: '24시영업', region: '가천디대', desc: '가전디다이어 정식 근무 모집!', tc: 180000, type: '노래방' },
  { id: 'p4', name: '1시2시30분 16만', region: '역북 안산', desc: '지친 근로도 500만 님빈소...', tc: 160000, type: '노래방' },
  { id: 'p5', name: '광주 충효동', region: '광주 오정', desc: '광주 상무지구 근접 문자로 소문...', tc: 120000, type: '소문' },
  { id: 'p6', name: '코엔터테인', region: '강남 역삼', desc: 'TC 18만원 지불비54 만원120...', tc: 180000, type: '노래방' },
  { id: 'p7', name: '가락1번지', region: '송파 가락', desc: '시급 소고기 가능! 봉 브...', tc: 180000, type: '노래방' },
  { id: 'p8', name: '강남랩오', region: '강남 대치', desc: '2시24시50만원! 지급300만...', tc: 150000, type: '바' },
];

const BOARDS = [
  { id: 'talk', title: '내 얘기 좀 들어봐', posts: [{ t: '20대 초 대학생인데요', d: '2026-03-22' }, { t: '공고성 글로 관리자에 의해 삭제되었습니다', d: '2026-03-14' }, { t: '어디서 광고보나요?', d: '2026-01-06' }] },
  { id: 'buddy', title: '단짝친구찾기', posts: [{ t: '인천 계양에서 같이 다니실분 ♥', d: '2026-03-27' }, { t: '사이즈 안 봐는 곳 ♥♥', d: '2026-03-27' }, { t: '같이 일할분 문의 주세요', d: '2026-01-28' }] },
  { id: 'info', title: '밤문화 정보공유', posts: [{ t: '고수익알바 사기 사례들', d: '2023-09-07' }, { t: '쉬운데 아가씨는 수입은 얼마인가?', d: '2021-08-30' }, { t: '힐러 부분분소 고졸', d: '2021-06-18' }] },
  { id: 'news', title: '밤문화 뉴스', posts: [{ t: '[예술·관광] 정부 "유흥주점 현행법 준수..."', d: '2025-10-18' }, { t: '"유흥업소 종사 1340만건 부가세 40% 인상"', d: '2023-04-26' }] },
  { id: 'event', title: '여우알바 이벤트', posts: [{ t: '[이벤트종료] 수만명참여 무료 공고 이벤트', d: '2020-11-11' }] },
];

function JobCard({ id, name, region, desc, tc, type, gold }: { id: string; name: string; region: string; desc: string; tc: number; type: string; gold?: boolean }) {
  return (
    <Link href={`/jobs/${id}/`} className={`card-sm group flex flex-col overflow-hidden transition hover:border-[#1E3A5F]/60 ${gold ? 'border-[#C9A961]/30' : ''}`}>
      <div className={`h-20 flex items-center justify-center ${gold ? 'bg-gradient-to-br from-[#C9A961]/10 to-[#1E3A5F]/10' : 'bg-[#112240]'}`}>
        <span className="text-2xl opacity-30">🦊</span>
      </div>
      <div className="flex-1 p-3">
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-sm font-semibold leading-tight group-hover:text-[#C9A961]">{name}</h3>
          <span className="shrink-0 text-[10px] text-[#64748B]">{region}</span>
        </div>
        <p className="mt-1 truncate text-xs text-[#64748B]">{desc}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs font-bold text-[#C9A961]">TC {tc.toLocaleString()}원</span>
          <span className="text-[10px] text-[#64748B]">{type}</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const inp = "w-full rounded-lg border border-[#1E3A5F]/30 bg-[#112240] px-3 py-2 text-xs outline-none placeholder:text-[#64748B] focus:border-[#1E3A5F]";

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Top section: Region + Login */}
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_280px]">
        {/* Region chips */}
        <div className="card p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold"><MapPin className="h-4 w-4 text-[#C9A961]" /> 지역별 채용정보</h2>
          <div className="flex flex-wrap gap-1.5">
            {REGIONS.map(r => (
              <Link key={r} href={`/jobs/?region=${r}`} className="rounded-lg bg-[#112240] px-2.5 py-1 text-xs text-[#94A3B8] transition hover:bg-[#1E3A5F] hover:text-white">{r}</Link>
            ))}
          </div>
          {SUB_REGIONS['서울'] && (
            <div className="mt-2 flex flex-wrap gap-1">
              {SUB_REGIONS['서울'].map(s => (
                <Link key={s} href={`/jobs/?region=서울&sub=${s}`} className="text-[11px] text-[#64748B] hover:text-[#C9A961]">{s}</Link>
              ))}
            </div>
          )}
        </div>

        {/* Login form */}
        <div className="card p-4">
          <form onSubmit={e => e.preventDefault()} className="space-y-2">
            <input type="text" placeholder="아이디" value={loginId} onChange={e => setLoginId(e.target.value)} className={inp} />
            <input type="password" placeholder="비밀번호" value={loginPw} onChange={e => setLoginPw(e.target.value)} className={inp} />
            <button type="submit" className="btn btn-navy w-full py-2 text-xs">로그인</button>
            <div className="flex justify-between text-[10px] text-[#64748B]">
              <Link href="/register/" className="hover:text-[#C9A961]">회원가입</Link>
              <span>아이디 | 비밀번호 찾기</span>
            </div>
          </form>
        </div>
      </div>

      {/* VVIP */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-base font-bold"><Star className="h-4 w-4 text-[#C9A961]" /> VVIP 채용정보</h2>
          <Link href="/post-job/" className="flex items-center gap-1 text-xs text-[#C9A961] hover:underline">광고등록 <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {VVIP.map(j => <JobCard key={j.id} {...j} gold />)}
        </div>
      </section>

      {/* 우대등록 */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-base font-bold"><Gem className="h-4 w-4 text-[#94A3B8]" /> 우대등록 채용정보</h2>
          <Link href="/post-job/" className="flex items-center gap-1 text-xs text-[#C9A961] hover:underline">광고등록 <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PREMIUM.map(j => <JobCard key={j.id} {...j} />)}
        </div>
      </section>

      {/* 프리미엄 */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-base font-bold"><Trophy className="h-4 w-4 text-[#64748B]" /> 프리미엄 채용정보</h2>
          <Link href="/post-job/" className="flex items-center gap-1 text-xs text-[#C9A961] hover:underline">광고등록 <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PREMIUM.slice(0, 4).map(j => <JobCard key={j.id + 'pr'} {...j} />)}
        </div>
      </section>

      {/* Community Preview */}
      <section className="mt-6 mb-8">
        <h2 className="mb-3 text-base font-bold">커뮤니티</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {BOARDS.map(board => (
            <div key={board.id} className="card p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{board.title}</h3>
                <Link href={`/community/?board=${board.id}`} className="text-[10px] text-[#C9A961] hover:underline">더보기+</Link>
              </div>
              <ul className="space-y-1">
                {board.posts.map((post, i) => (
                  <li key={i} className="flex items-center justify-between text-xs">
                    <span className="truncate text-[#94A3B8] pr-2">{post.t}</span>
                    <span className="shrink-0 text-[10px] text-[#64748B]">{post.d}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Safety */}
      <section className="mb-8">
        <div className="card-sm flex items-center gap-3 border-[#10B981]/20 p-4">
          <Shield className="h-7 w-7 shrink-0 text-[#10B981]" />
          <div>
            <p className="text-sm font-semibold text-[#10B981]">안전한 여우알바</p>
            <p className="mt-0.5 text-xs text-[#94A3B8]">성인인증 필수 · AI 허위공고 필터링 · 24시간 안전 지원</p>
          </div>
        </div>
      </section>
    </div>
  );
}
