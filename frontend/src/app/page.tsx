'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, Star, ArrowRight } from 'lucide-react';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const SUBS: Record<string, string[]> = { '서울': ['강남', '서초', '송파', '강서', '마포', '홍대', '이태원', '잠실', '신림', '건대'], '경기': ['수원', '성남', '고양', '용인', '부천', '안산'], '부산': ['해운대', '서면', '남포동'] };

const VVIP = [
  { id: 'v1', name: '나이스', label: '전국유일\n24시간', sub: '수원 영통', desc: '주간 야간 영업 주간근무 공모!!', tc: 130000, type: '노래방', color: '#1E3A5F' },
  { id: 'v2', name: '2시간240만', label: '2시간240만\n곤수보장♡', sub: '강남 역삼', desc: '세이렌 주수5원 면접비지급', tc: 200000, type: '퍼트', color: '#C9A961' },
  { id: 'v3', name: '첫출근시 10만', label: '파트너', sub: '강남 신논현', desc: '강남 해브스가리카 주수보장', tc: 160000, type: '라운지', color: '#4A7A4A' },
  { id: 'v4', name: '숙소 출퇴지원', label: '24시\n주간조모집', sub: '강남 역삼', desc: '24시 주간근가 쌍일토', tc: 150000, type: '바', color: '#8B4513' },
  { id: 'v5', name: '대구달서구\n중구&남구', label: '초보OK\n24시환영', sub: '대구 1등', desc: '대구 1등 사무실 터치X', tc: 50000, type: '노래방', color: '#E91E63' },
  { id: 'v6', name: '강남 퍼블릭\n최고 TC', label: '손님터치\n피혈현대포', sub: '강남 역삼', desc: '테이블중 터치봉 편전비', tc: 140000, type: '노래방', color: '#1E3A5F' },
  { id: 'v7', name: '라인', label: '라인\n라인현심상', sub: '강남 역삼', desc: '1등 라인 보근무가능', tc: 150000, type: '노래방', color: '#333' },
  { id: 'v8', name: '주간조모집', label: '주간에도\n일해요!!', sub: '강남 역삼', desc: '24시영업 주간근무가능', tc: 120000, type: '노래방', color: '#C9A961' },
];

const UGRADE = Array.from({ length: 20 }, (_, i) => ({
  id: `u${i + 1}`,
  name: ['광주\n상무지구', '팔원테이블\n순수테이블', '종합바', '1시2시30분', '강남,고대역\n노래방알바', '송파 가락', '24시영업\n가족타이야', '나나신전44', '노래도우미\n업계최고', '서울최강\nM Z사장', '가라동\n이지', '부천', '베스트', '나드로봉', '송파1등\n수강장년러비', '최고대우', '광주충효봉\n충알바', '인천', '송파교이의\n새을삼전', '전대마충\n노래도우미'][i],
  sub: ['광주', '강남', '송파', '안산', '강남', '송파', '가천', '강남', '누월드', '서울', '서울', '부천', '강남', '대구', '송파', '강남', '광주', '인천', '서초', '원주'][i],
  tc: [120000, 180000, 180000, 160000, 70000, 180000, 150000, 0, 60000, 60000, 150000, 60000, 60000, 140000, 150000, 140000, 120000, 60000, 60000, 70000][i],
  type: '노래방',
  color: ['#E91E63', '#C9A961', '#1E3A5F', '#4A7A4A', '#E91E63', '#C9A961', '#1E3A5F', '#666', '#E91E63', '#4A7A4A', '#C9A961', '#666', '#E91E63', '#1E3A5F', '#C9A961', '#666', '#E91E63', '#1E3A5F', '#C9A961', '#4A7A4A'][i],
}));

const BOARDS = [
  { id: 'talk', title: '내 얘기 좀 들어봐', sub: '여성회원전용', posts: ['20대 초 대학생인데요', '공고성 글 관리자에 의해 삭제', '어디서 광고보나요?', '77,88만 그냥 바주는걸', '아직도 번들 5'] },
  { id: 'buddy', title: '단짝친구찾기', sub: '여성회원전용', posts: ['인천 계양에서 같이 다니실분 ♥', '사이즈 안 봐는 곳 ♥♥', '같이 일할분 문의주세요', '매장 알바를 구해야하는데', '나글교이따~'] },
  { id: 'info', title: '밤문화 정보공유', posts: ['고수익알바 사기 사례들', '시오남발이 고한빌란?', '쉬운데 수입은 얼마?', '힐러 부분분소', '손님방법 BEST 4'] },
  { id: 'news', title: '밤문화 뉴스', posts: ['정부 "유흥주점 현행법..."', '유흥업소 1340만 부가세', '유흥업소 영업 17곳만', '거리두기 해제 유흥업'] },
  { id: 'event', title: '여우알바 이벤트', posts: ['[이벤트종료] 수만명참여 무료'] },
];

/* ── VVIP 카드 (좌: 컬러라벨 + 우: 정보) ── */
function VvipCard({ d }: { d: typeof VVIP[0] }) {
  return (
    <Link href={`/jobs/${d.id}/`} className="flex border border-[#C9A961] rounded overflow-hidden hover:shadow-md transition bg-white">
      <div className="w-[90px] shrink-0 flex items-center justify-center p-2 text-center" style={{ background: d.color }}>
        <span className="text-xs font-bold text-[#ffffff] leading-tight whitespace-pre-line">{d.label}</span>
      </div>
      <div className="flex-1 p-2.5 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-sm font-bold truncate">{d.name}</span>
          <span className="text-xs text-[#999] shrink-0">{d.sub}</span>
        </div>
        <p className="text-xs text-[#666] truncate mt-0.5">{d.desc}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs font-bold"><span className="text-[#E91E63]">TC</span> {d.tc.toLocaleString()}원</span>
          <span className="text-xs text-[#999]">{d.type}</span>
        </div>
      </div>
    </Link>
  );
}

/* ── 우대/프리미엄 카드 (좌: 컬러라벨 + 우: 정보) ── */
function UCard({ d }: { d: typeof UGRADE[0] }) {
  return (
    <Link href={`/jobs/${d.id}/`} className="flex border border-[#e0e0e0] hover:border-[#1E3A5F] transition bg-white">
      <div className="w-[70px] shrink-0 flex items-center justify-center p-1.5 text-center" style={{ background: d.color }}>
        <span className="text-xs font-bold text-[#ffffff] leading-tight whitespace-pre-line">{d.name.length > 8 ? d.name.slice(0, 8) : d.name}</span>
      </div>
      <div className="flex-1 p-2 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-sm font-bold truncate">{d.name.split('\n')[0]}</span>
          <span className="text-xs text-[#999] shrink-0">{d.sub}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-bold"><span className="text-[#E91E63]">TC</span> {d.tc > 0 ? d.tc.toLocaleString() + '원' : '-'}</span>
          <span className="text-xs text-[#999]">{d.type}</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [uid, setUid] = useState('');
  const [upw, setUpw] = useState('');

  return (
    <div className="mx-auto max-w-[960px] px-4 py-4">
      {/* ── 로그인 + 지역별 ── */}
      <div className="flex gap-4 flex-col md:flex-row">
        <div className="card p-4 md:w-[240px] shrink-0">
          <form onSubmit={e => e.preventDefault()} className="space-y-2">
            <input type="text" placeholder="아이디" value={uid} onChange={e => setUid(e.target.value)} className="input" />
            <div className="flex gap-2">
              <input type="password" placeholder="비밀번호" value={upw} onChange={e => setUpw(e.target.value)} className="input flex-1" />
              <button type="submit" className="btn btn-navy px-4 py-2 shrink-0">로그인</button>
            </div>
            <div className="flex justify-between text-xs text-[#999]">
              <Link href="/register/" className="text-[#E91E63] font-medium">회원가입</Link>
              <span className="cursor-pointer hover:text-[#666]">아이디 | 비밀번호 찾기</span>
            </div>
          </form>
        </div>

        <div className="card p-4 flex-1">
          <h2 className="flex items-center gap-1.5 text-base font-bold mb-3">
            <Heart className="h-4 w-4 text-[#E91E63]" /> 지역별 채용정보 <Heart className="h-4 w-4 text-[#E91E63]" />
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {REGIONS.map(r => <Link key={r} href={`/jobs/?region=${r}`} className="pill hover:bg-[#1E3A5F] hover:text-[#ffffff] hover:border-[#1E3A5F]">{r}</Link>)}
          </div>
          {Object.entries(SUBS).map(([r, ss]) => (
            <div key={r} className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span className="text-xs font-bold text-[#E91E63]">{r}</span>
              {ss.map(s => <Link key={s} href={`/jobs/?region=${r}&sub=${s}`} className="text-xs text-[#999] hover:text-[#1E3A5F]">{s}</Link>)}
            </div>
          ))}
        </div>
      </div>

      {/* ── VVIP (2행x4열, 좌컬러+우텍스트) ── */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title"><Star className="h-5 w-5 text-[#C9A961]" /> VVIP 채용정보</h2>
          <Link href="/post-job/" className="text-xs text-[#C9A961] font-medium hover:underline flex items-center gap-1">광고등록 <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {VVIP.map(d => <VvipCard key={d.id} d={d} />)}
        </div>
      </section>

      {/* ── 우대등록 (5행x4열, 좌컬러+우텍스트) ── */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">우대등록 채용정보</h2>
          <Link href="/post-job/" className="text-xs text-[#C9A961] font-medium hover:underline flex items-center gap-1">광고등록 <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#e0e0e0] border border-[#e0e0e0]">
          {UGRADE.map(d => <UCard key={d.id} d={d} />)}
        </div>
      </section>

      {/* ── 프리미엄 (1행x4열) ── */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">프리미엄 채용정보</h2>
          <Link href="/post-job/" className="text-xs text-[#C9A961] font-medium hover:underline flex items-center gap-1">광고등록 <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#e0e0e0] border border-[#e0e0e0]">
          {UGRADE.slice(0, 4).map(d => <UCard key={d.id + 'pr'} d={d} />)}
        </div>
      </section>

      {/* ── 커뮤니티 ── */}
      <section className="mt-6 mb-4">
        <h2 className="section-title mb-4">커뮤니티</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {BOARDS.map(b => (
            <div key={b.id} className="card overflow-hidden">
              <div className="flex items-center justify-between bg-[#f7f8fa] border-b border-[#e0e0e0] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">{b.title}</h3>
                  {b.sub && <span className="text-xs text-[#E91E63] font-medium">{b.sub}</span>}
                </div>
                <Link href={`/community/?board=${b.id}`} className="btn btn-navy px-2.5 py-1 text-xs">더보기+</Link>
              </div>
              <ul>
                {b.posts.map((p, i) => (
                  <li key={i} className="border-b border-[#f0f0f0] last:border-0">
                    <Link href={`/community/${b.id}-${i}/`} className="block px-4 py-2 text-sm text-[#666] truncate hover:text-[#222] hover:bg-[#f7f8fa]">{p}</Link>
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
