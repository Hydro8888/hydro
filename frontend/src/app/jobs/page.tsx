'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

const REGIONS = ['전체', '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const TYPES = ['전체', '룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];

const MOCK = [
  { id: '1', title: '강남 프리미엄 라운지 스탭', co: '강남 프리미엄', region: '서울', type: '라운지', pay: 500000, urgent: true, verified: true },
  { id: '2', title: '홍대 감성 바 서빙', co: '홍대 감성바', region: '서울', type: '바', pay: 400000, urgent: false, verified: false },
  { id: '3', title: '부산 해운대 클럽 스탭', co: '해운대 나이트', region: '부산', type: '클럽', pay: 350000, urgent: true, verified: true },
  { id: '4', title: '압구정 VIP 룸 도우미', co: '압구정 VIP', region: '서울', type: '룸', pay: 600000, urgent: false, verified: true },
  { id: '5', title: '이태원 프리미엄 라운지', co: '이태원 라운지', region: '서울', type: '라운지', pay: 450000, urgent: false, verified: false },
  { id: '6', title: '대구 동성로 노래방 도우미', co: '동성로 노래방', region: '대구', type: '노래방', pay: 300000, urgent: true, verified: false },
];

export default function JobsPage() {
  const [region, setRegion] = useState('전체');
  const [type, setType] = useState('전체');
  const filtered = MOCK.filter(j => (region === '전체' || j.region === region) && (type === '전체' || j.type === type));

  return (
    <div className="mx-auto max-w-[960px] px-4 py-5">
      <h1 className="text-xl font-bold mb-1">채용정보</h1>
      <p className="text-sm text-[#999] mb-4">총 <b className="text-[#222]">{filtered.length}</b>건</p>

      <div className="flex gap-5 flex-col md:flex-row">
        <div className="md:w-[220px] shrink-0 space-y-4">
          <div>
            <p className="text-sm font-bold mb-2">지역</p>
            <div className="flex flex-wrap gap-1.5">{REGIONS.map(r => <button key={r} onClick={() => setRegion(r)} className={`pill ${region === r ? 'pill-active' : ''}`}>{r}</button>)}</div>
          </div>
          <div>
            <p className="text-sm font-bold mb-2">업종</p>
            <div className="flex flex-wrap gap-1.5">{TYPES.map(t => <button key={t} onClick={() => setType(t)} className={`pill ${type === t ? 'pill-active' : ''}`}>{t}</button>)}</div>
          </div>
          <div>
            <p className="text-sm font-bold mb-2">정렬</p>
            <select className="input"><option>최신순</option><option>급여 높은순</option><option>인기순</option></select>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {filtered.map(j => (
            <Link key={j.id} href={`/jobs/${j.id}/`} className="card card-hover flex gap-4 p-4">
              <div className="w-16 h-16 shrink-0 bg-[#1E3A5F] rounded-lg flex items-center justify-center"><span className="text-2xl">🦊</span></div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  {j.urgent && <span className="tag tag-urgent">급구</span>}
                  {j.verified && <span className="tag tag-verified">인증</span>}
                  <span className="tag tag-type">{j.type}</span>
                </div>
                <h3 className="text-base font-bold truncate">{j.title}</h3>
                <p className="text-xs text-[#999]">{j.co}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-[#999]"><MapPin className="h-3 w-3" />{j.region}</span>
                  <span className="text-base font-bold text-[#C9A961]">{j.pay.toLocaleString()}원/일</span>
                </div>
              </div>
            </Link>
          ))}
          {!filtered.length && <p className="text-center py-12 text-[#999]">조건에 맞는 공고가 없습니다.</p>}
        </div>
      </div>
    </div>
  );
}
