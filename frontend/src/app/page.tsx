'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, Star, ArrowRight } from 'lucide-react';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const SUBS: Record<string, string[]> = {
  '서울': ['강남', '서초', '송파', '강서', '마포', '홍대', '이태원', '잠실', '신림', '건대'],
  '경기': ['수원', '성남', '고양', '용인', '부천', '안산'],
  '부산': ['해운대', '서면', '남포동'],
};

const VVIP = [
  { id: 'v1', name: '전국유일 24시간', sub: '수원 영통', desc: '주간 야간 영업 주간근무 공모!!', tc: 130000, type: '노래방' },
  { id: 'v2', name: '2시간240만', sub: '강남 역삼', desc: '세이렌 주수5원 면접비지급', tc: 200000, type: '퍼트' },
  { id: 'v3', name: '파트너', sub: '강남 신논현', desc: '강남 해브스가리 주수보장', tc: 160000, type: '라운지' },
  { id: 'v4', name: '24시 주간조모집', sub: '강남 역삼', desc: '♡24시 주간근가 ♡ 쌍일토', tc: 150000, type: '바' },
  { id: 'v5', name: '초보도OK 24시환영', sub: '대구 1등', desc: '대구 1등 사무실 / 터치X', tc: 50000, type: '노래방' },
  { id: 'v6', name: '강남 퍼블릭 최고TC', sub: '강남 역삼', desc: '★테이블중 터치봉★ 편전비', tc: 140000, type: '노래방' },
  { id: 'v7', name: '라인', sub: '강남 역삼', desc: '[가견] 1등 -라인 ♥보근무', tc: 150000, type: '노래방' },
  { id: 'v8', name: '주간에도 일해요!', sub: '강남 역삼', desc: '24시영업! 주간근무가능', tc: 120000, type: '노래방' },
];

const UGRADE = Array.from({ length: 20 }, (_, i) => ({
  id: `u${i + 1}`,
  name: ['광주 상무지구', '팔원테이블', '종합', '1시2시30분', '강남알바', '혜정만원', '24시영업', '나나신전', '사무실직장', '충훈등대장', '가라동 이지', '부천', '베스트', '나드로봉', '송파1등', '최고대우', '광주충효봉', '계산봉', '포지마의', '전대마충'][i],
  sub: ['광주', '강남', '송파', '안산', '강남', '강남', '가천', '강남', '누월드', '서울', '서울', '부천', '강남', '대구', '송파', '강남', '광주', '강남', '서초', '원주'][i],
  tc: [120000, 180000, 180000, 160000, 70000, 180000, 150000, 0, 60000, 60000, 150000, 60000, 60000, 140000, 150000, 140000, 120000, 60000, 60000, 70000][i],
  type: '노래방',
}));

const BOARDS = [
  { id: 'talk', title: '내 얘기 좀 들어봐', sub: '여성회원전용', posts: ['20대 초 대학생인데요', '공고성 글 관리자에 의해 삭제', '어디서 광고보나요?', '77,88만 그냥 바주는걸', '아직도 번들 5'] },
  { id: 'buddy', title: '단짝친구찾기', sub: '여성회원전용', posts: ['인천 계양에서 같이 다니실분 ♥', '사이즈 안 봐는 곳 ♥♥', '같이 일할분 문의주세요', '매장 알바를 구해야하는데', '나글교이따~'] },
  { id: 'info', title: '밤문화 정보공유', posts: ['고수익알바 사기 사례들', '시오남발이 고한빌란?', '쉬운데 수입은 얼마?', '힐러 부분분소 고졸', '손님방법 BEST 4'] },
  { id: 'news', title: '밤문화 뉴스', posts: ['정부 "유흥주점 현행법..."', '유흥업소 1340만 부가세', '유흥업소 영업 17곳만', '거리두기 해제 유흥업'] },
  { id: 'event', title: '여우알바 이벤트', posts: ['[이벤트종료] 수만명참여 무료'] },
];

export default function HomePage() {
  const [uid, setUid] = useState('');
  const [upw, setUpw] = useState('');

  return (
    <div className="mx-auto max-w-[960px] px-3 py-3">
      {/* ── 로그인 + 지역별 ── */}
      <div className="flex gap-3 flex-col md:flex-row">
        {/* 로그인 */}
        <div className="card p-3 md:w-[220px] shrink-0">
          <form onSubmit={e => e.preventDefault()} className="space-y-1.5">
            <input type="text" placeholder="아이디" value={uid} onChange={e => setUid(e.target.value)} className="w-full border border-[#ddd] rounded px-2 py-1.5 text-[12px] outline-none focus:border-[#1E3A5F]" />
            <div className="flex gap-1">
              <input type="password" placeholder="비밀번호" value={upw} onChange={e => setUpw(e.target.value)} className="flex-1 border border-[#ddd] rounded px-2 py-1.5 text-[12px] outline-none focus:border-[#1E3A5F]" />
              <button type="submit" className="btn btn-navy px-3 py-1.5 text-[11px]">로그인</button>
            </div>
            <div className="flex justify-between text-[10px] text-[#999]">
              <Link href="/register/" className="text-[#E91E63]">회원가입</Link>
              <span>아이디 | 비밀번호 찾기</span>
            </div>
          </form>
        </div>

        {/* 지역별 채용 */}
        <div className="card p-3 flex-1">
          <h2 className="text-[13px] font-bold mb-2 flex items-center gap-1"><Heart className="h-3 w-3 text-[#E91E63] fill-[#E91E63]" /> 지역별 채용정보 <Heart className="h-3 w-3 text-[#E91E63] fill-[#E91E63]" /></h2>
          <div className="flex flex-wrap gap-1">
            {REGIONS.map(r => <Link key={r} href={`/jobs/?region=${r}`} className="bg-[#f5f5f5] border border-[#e0e0e0] rounded px-2 py-0.5 text-[11px] text-[#555] hover:bg-[#1E3A5F] hover:text-white hover:border-[#1E3A5F]">{r}</Link>)}
          </div>
          {Object.entries(SUBS).map(([r, ss]) => (
            <div key={r} className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0">
              <span className="text-[10px] font-bold text-[#E91E63]">{r}</span>
              {ss.map(s => <Link key={s} href={`/jobs/?region=${r}&sub=${s}`} className="text-[10px] text-[#888] hover:text-[#E91E63]">{s}</Link>)}
            </div>
          ))}
        </div>
      </div>

      {/* ── VVIP 채용정보 ── */}
      <section className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="section-title"><Star className="h-4 w-4 text-[#C9A961] fill-[#C9A961]" /> VVIP 채용정보</h2>
          <Link href="/post-job/" className="text-[11px] text-[#C9A961] hover:underline flex items-center gap-0.5">광고등록 <Heart className="h-3 w-3 fill-[#C9A961]" /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VVIP.map(v => (
            <Link key={v.id} href={`/jobs/${v.id}/`} className="vvip-card">
              <div className="bg-[#FFFDE7] px-2 py-3 text-center">
                <p className="text-[13px] font-bold text-[#C9A961]">{v.name}</p>
                <p className="text-[10px] text-[#888]">{v.sub}</p>
              </div>
              <div className="px-2 py-2">
                <p className="text-[11px] text-[#666] truncate">{v.desc}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold"><span className="text-[#E91E63]">TC</span> {v.tc.toLocaleString()}원</span>
                  <span className="text-[10px] text-[#999]">{v.type}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 우대등록 채용정보 ── */}
      <section className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="section-title">우대등록 채용정보</h2>
          <Link href="/post-job/" className="text-[11px] text-[#C9A961] hover:underline flex items-center gap-0.5">광고등록 <Heart className="h-3 w-3 fill-[#C9A961]" /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] bg-[#ddd] border border-[#ddd]">
          {UGRADE.map(u => (
            <Link key={u.id} href={`/jobs/${u.id}/`} className="job-card bg-white">
              <div className="w-[50px] h-[50px] shrink-0 bg-[#f0f0f0] rounded flex items-center justify-center">
                <span className="text-[8px] text-[#C9A961] font-bold text-center leading-tight">{u.name.slice(0, 4)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold truncate">{u.name}</p>
                <p className="text-[10px] text-[#999]">{u.sub}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px]"><span className="text-[#E91E63] font-bold">TC</span> {u.tc > 0 ? u.tc.toLocaleString() + '원' : '-'}</span>
                  <span className="text-[9px] text-[#bbb]">{u.type}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 프리미엄 채용정보 ── */}
      <section className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="section-title">프리미엄 채용정보</h2>
          <Link href="/post-job/" className="text-[11px] text-[#C9A961] hover:underline flex items-center gap-0.5">광고등록 <Heart className="h-3 w-3 fill-[#C9A961]" /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-[1px] bg-[#ddd] border border-[#ddd]">
          {UGRADE.slice(0, 4).map(u => (
            <Link key={u.id + 'pr'} href={`/jobs/${u.id}/`} className="job-card bg-white">
              <div className="w-[50px] h-[50px] shrink-0 bg-[#f0f0f0] rounded flex items-center justify-center">
                <span className="text-[8px] text-[#999] font-bold text-center leading-tight">{u.name.slice(0, 4)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold truncate">{u.name}</p>
                <p className="text-[10px] text-[#999]">{u.sub}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px]"><span className="text-[#E91E63] font-bold">TC</span> {u.tc > 0 ? u.tc.toLocaleString() + '원' : '-'}</span>
                  <span className="text-[9px] text-[#bbb]">{u.type}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 커뮤니티 ── */}
      <section className="mt-5 mb-6">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {BOARDS.map(b => (
            <div key={b.id} className="card overflow-hidden">
              <div className="flex items-center justify-between bg-[#f9f9f9] border-b border-[#eee] px-3 py-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-[12px] font-bold">{b.title}</h3>
                  {b.sub && <span className="text-[9px] text-[#E91E63]">{b.sub}</span>}
                </div>
                <Link href={`/community/?board=${b.id}`} className="btn btn-pink px-2 py-0.5 text-[9px]">더보기+</Link>
              </div>
              <ul>
                {b.posts.map((p, i) => (
                  <li key={i} className="border-b border-[#f0f0f0] last:border-0">
                    <Link href={`/community/${b.id}-${i}/`} className="block px-3 py-1.5 text-[11px] text-[#555] truncate hover:text-[#E91E63]">{p}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
