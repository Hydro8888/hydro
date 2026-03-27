'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Briefcase, MapPin, Star, MessageCircle, Users, Headphones, FileEdit, Heart, ArrowRight } from 'lucide-react';

/* ── 아이콘 메뉴 (러브알바 상단 6개 아이콘) ── */
const ICON_MENU = [
  { href: '/jobs/', icon: Briefcase, label: '채용정보' },
  { href: '/jobs/region/', icon: MapPin, label: '지역별채용' },
  { href: '/reviews/', icon: Star, label: '광고후기' },
  { href: '/talent/', icon: Users, label: '인재정보' },
  { href: '/community/', icon: MessageCircle, label: '커뮤니티' },
  { href: '/support/', icon: Headphones, label: '고객센터' },
];

/* ── 지역 ── */
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const SUBS: Record<string, string[]> = {
  '서울': ['강남', '서초', '송파', '강서', '마포', '홍대', '이태원', '잠실', '신림', '건대'],
  '부산': ['해운대', '서면', '남포동'],
  '경기': ['수원', '성남', '고양', '용인', '부천', '안산'],
};

/* ── VVIP 8개 (2행x4열) ── */
const VVIP = [
  { id: 'v1', name: '전국유일 24시간', sub: '수원 영통', desc: '주간 야간 영업 주간근무 공모!!!', tc: 130000, type: '노래방' },
  { id: 'v2', name: '세이렌', sub: '강남 역삼', desc: '세이렌 주수5원금봉 면접비지급', tc: 200000, type: '퍼트' },
  { id: 'v3', name: '곤수보장', sub: '강남 신논현', desc: '강남 해브스가리카 주수보장...', tc: 160000, type: '라운지' },
  { id: 'v4', name: '숙소 출퇴지원', sub: '강남 역삼', desc: '♡24시 주간근가♡쌍일토...', tc: 150000, type: '바' },
  { id: 'v5', name: '초보도OK 24시환영', sub: '대구 1등', desc: '대구 1등 사무실 / 터치X / 쌩X...', tc: 50000, type: '노래방' },
  { id: 'v6', name: '강남 퍼블릭 최고TC', sub: '강남 역삼', desc: '★테이블중 터치딩봉★ 편전비...', tc: 140000, type: '노래방' },
  { id: 'v7', name: '라인', sub: '강남 역삼', desc: '[가견] 1등 -라인 ♥보근무가능...', tc: 150000, type: '노래방' },
  { id: 'v8', name: '주간에도 일해요!', sub: '강남 역삼', desc: '24시영업! 주간근무가능 주간에 알 알이...', tc: 120000, type: '노래방' },
];

/* ── 우대등록 20개 (5행x4열) ── */
const PREMIUM = [
  { id: 'u1', name: '광주 상무지구', sub: '광주 오정', tc: 120000, type: '소문' },
  { id: 'u2', name: '팔원테이블 순수테이블', sub: '강남 역삼', tc: 180000, type: '노래방' },
  { id: 'u3', name: '종합', sub: '가작1번지', tc: 180000, type: '노래방' },
  { id: 'u4', name: '1시2시30분 16만', sub: '역북 안산', tc: 160000, type: '노래방' },
  { id: 'u5', name: '강남알바', sub: '강남', tc: 70000, type: '노래방' },
  { id: 'u6', name: '혜정만원 쌩이주', sub: '니나구', tc: 180000, type: '노래방' },
  { id: 'u7', name: '24시영업 가족타이야', sub: '가천디대', tc: 150000, type: '노래방' },
  { id: 'u8', name: '나나신전44', sub: '강남 역삼', tc: 0, type: '노래방' },
  { id: 'u9', name: '사무실직장 대환영', sub: '누월드', tc: 60000, type: '노래방' },
  { id: 'u10', name: '충훈,등대장 최고M', sub: '서울 충구', tc: 60000, type: '노래방' },
  { id: 'u11', name: '가라동 이지', sub: '서울 강구', tc: 150000, type: '노래방' },
  { id: 'u12', name: '부천', sub: '경고피', tc: 60000, type: '노래방' },
  { id: 'u13', name: '베스트', sub: '베스트', tc: 60000, type: '노래방' },
  { id: 'u14', name: '나드로봉', sub: '대구1동고수기', tc: 140000, type: '봉뿔' },
  { id: 'u15', name: '송파1등', sub: '송파상정', tc: 150000, type: '봉뿔' },
  { id: 'u16', name: '최고대우', sub: '렌드포', tc: 140000, type: '노래방' },
  { id: 'u17', name: '광주충효봉', sub: '오정치', tc: 120000, type: '노래방' },
  { id: 'u18', name: '계산봉', sub: '강남 역삼', tc: 60000, type: '노래방' },
  { id: 'u19', name: '포지마의 세용삼성', sub: '서초 역삼', tc: 60000, type: '노래방' },
  { id: 'u20', name: '전대마충 노래도우미', sub: '원불드', tc: 70000, type: '노래방' },
];

/* ── 커뮤니티 미리보기 ── */
const BOARDS = [
  { id: 'talk', title: '내 얘기 좀 들어봐', sub: '여성회원전용', posts: ['20대 초 대학생인데요', '공고성 글로 관리자에 의해 삭제...', '어디서 광고보나요?', '77,88,88만 그냥 모르 바주는걸', '아직도 번들 5'] },
  { id: 'buddy', title: '단짝친구찾기', sub: '여성회원전용', posts: ['인천 계양에서 같이 다니실분 ♥', '사이즈 안 봐는 곳 ♥♥', '같이 일할분 문의 주세요', '매장 알바를 구해야는 친의요', '나글교이따~'] },
  { id: 'info', title: '밤문화 정보공유', posts: ['고수익알바 사기 사례들', '시오남발이 고한빌란 찍인다?', '쉬운데 아가씨는 수입은?', '힐러 부분분소 고졸', '힐러 본론조 손님방법 BEST 4'] },
  { id: 'news', title: '밤문화 뉴스', posts: ['[예술·관광] 정부 "유흥주점..."', '"유흥업소 종사 1340만..."', '"유흥업소 영업 17곳만..."', '거리두기 해제에 유흥업...'] },
  { id: 'event', title: '여우알바 이벤트', posts: ['[이벤트종료] 수만명참여 무료 공고'] },
];

/* ── 카드 컴포넌트 ── */
function VCard({ d, gold }: { d: typeof VVIP[0]; gold?: boolean }) {
  return (
    <Link href={`/jobs/${d.id}/`} className={`card-sm group overflow-hidden ${gold ? 'border-[#C9A961]/30' : ''}`}>
      <div className={`h-16 flex items-center justify-center text-xs font-bold ${gold ? 'bg-gradient-to-r from-[#C9A961]/15 to-[#1E3A5F]/10 text-[#C9A961]' : 'bg-[#112240] text-[#94A3B8]'}`}>
        {d.name}
      </div>
      <div className="p-2.5">
        <p className="text-[10px] text-[#64748B]">{d.sub}</p>
        <p className="mt-0.5 truncate text-[11px] text-[#94A3B8]">{d.desc}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#C9A961]">TC {d.tc > 0 ? d.tc.toLocaleString() + '원' : '-'}</span>
          <span className="text-[9px] text-[#64748B]">{d.type}</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const inp = "w-full rounded border border-[#1E3A5F]/30 bg-[#112240] px-2.5 py-1.5 text-xs outline-none placeholder:text-[#64748B] focus:border-[#1E3A5F]";

  return (
    <div className="mx-auto max-w-6xl px-4">

      {/* ── 아이콘 메뉴바 (러브알바 핑크 바 → 네이비) ── */}
      <div className="mt-2 rounded-xl bg-[#1E3A5F] p-3">
        <div className="flex items-center justify-around">
          {ICON_MENU.map(({ href, icon: I, label }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 text-center">
              <I className="h-6 w-6 text-white/80" />
              <span className="text-[10px] font-medium text-white/90">{label}</span>
            </Link>
          ))}
          {/* 광고등록 (골드) */}
          <Link href="/post-job/" className="flex flex-col items-center gap-1 text-center">
            <FileEdit className="h-6 w-6 text-[#C9A961]" />
            <span className="text-[10px] font-bold text-[#C9A961]">광고등록</span>
          </Link>
        </div>
      </div>

      {/* ── 로그인 + 지역별 채용 (2열) ── */}
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_220px]">
        {/* 지역별 */}
        <div className="card p-3">
          <h2 className="mb-2 flex items-center gap-1 text-sm font-bold"><Heart className="h-3.5 w-3.5 text-[#C9A961]" /> 지역별 채용정보 <Heart className="h-3.5 w-3.5 text-[#C9A961]" /></h2>
          <div className="flex flex-wrap gap-1">
            {REGIONS.map(r => (
              <Link key={r} href={`/jobs/?region=${r}`} className="rounded bg-[#112240] px-2 py-1 text-[11px] text-[#94A3B8] hover:bg-[#1E3A5F] hover:text-white">{r}</Link>
            ))}
          </div>
          {Object.entries(SUBS).map(([region, subs]) => (
            <div key={region} className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-[10px] font-semibold text-[#C9A961]">{region}</span>
              {subs.map(s => <Link key={s} href={`/jobs/?region=${region}&sub=${s}`} className="text-[10px] text-[#64748B] hover:text-[#C9A961]">{s}</Link>)}
            </div>
          ))}
        </div>

        {/* 로그인 폼 */}
        <div className="card p-3">
          <form onSubmit={e => e.preventDefault()} className="space-y-1.5">
            <input type="text" placeholder="아이디" value={id} onChange={e => setId(e.target.value)} className={inp} />
            <div className="flex gap-1.5">
              <input type="password" placeholder="비밀번호" value={pw} onChange={e => setPw(e.target.value)} className={inp + ' flex-1'} />
              <button type="submit" className="btn btn-navy shrink-0 px-3 py-1.5 text-xs">로그인</button>
            </div>
            <div className="flex justify-between text-[10px] text-[#64748B]">
              <Link href="/register/" className="hover:text-[#C9A961]">회원가입</Link>
              <span>아이디 | 비밀번호 찾기</span>
            </div>
          </form>
        </div>
      </div>

      {/* ── VVIP 채용정보 (2행x4열 = 8개) ── */}
      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-base font-bold"><Star className="h-4 w-4 text-[#C9A961] fill-[#C9A961]" /> VVIP 채용정보</h2>
          <Link href="/post-job/" className="flex items-center gap-0.5 text-xs text-[#C9A961] hover:underline">광고등록 <Heart className="h-3 w-3" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {VVIP.map(d => <VCard key={d.id} d={d} gold />)}
        </div>
      </section>

      {/* ── 우대등록 채용정보 (5행x4열 = 20개) ── */}
      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-base font-bold">우대등록 채용정보</h2>
          <Link href="/post-job/" className="flex items-center gap-0.5 text-xs text-[#C9A961] hover:underline">광고등록 <Heart className="h-3 w-3" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PREMIUM.map(d => <VCard key={d.id} d={d} />)}
        </div>
      </section>

      {/* ── 프리미엄 채용정보 (1행x4열) ── */}
      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-base font-bold">프리미엄 채용정보</h2>
          <Link href="/post-job/" className="flex items-center gap-0.5 text-xs text-[#C9A961] hover:underline">광고등록 <Heart className="h-3 w-3" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PREMIUM.slice(0, 4).map(d => <VCard key={d.id + 'pr'} d={d} />)}
        </div>
      </section>

      {/* ── 커뮤니티 미리보기 ── */}
      <section className="mt-5 mb-6">
        <h2 className="mb-3 text-base font-bold">커뮤니티</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {BOARDS.map(b => (
            <div key={b.id} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#1E3A5F]/15 px-3 py-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold">{b.title}</h3>
                  {b.sub && <span className="text-[9px] text-[#F59E0B]">{b.sub}</span>}
                </div>
                <Link href={`/community/?board=${b.id}`} className="rounded bg-[#C9A961] px-2 py-0.5 text-[9px] font-bold text-[#0D1B2A]">더보기+</Link>
              </div>
              <ul>
                {b.posts.map((p, i) => (
                  <li key={i} className="border-b border-[#1E3A5F]/8 last:border-0">
                    <Link href={`/community/${b.id}-${i}/`} className="block truncate px-3 py-1.5 text-[11px] text-[#94A3B8] hover:text-white">{p}</Link>
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
