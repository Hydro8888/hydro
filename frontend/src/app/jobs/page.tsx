'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

const REGIONS = ['전체', '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const TYPES = ['전체', '룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];

const MOCK = [
  { id: '1', title: '강남 프리미엄 라운지 스탭', co: '강남 프리미엄', region: '서울', jobType: '라운지', pay: 500000, urgent: true, verified: true },
  { id: '2', title: '홍대 감성 바 서빙', co: '홍대 감성바', region: '서울', jobType: '바', pay: 400000, urgent: false, verified: false },
  { id: '3', title: '부산 해운대 클럽 스탭', co: '해운대 나이트', region: '부산', jobType: '클럽', pay: 350000, urgent: true, verified: true },
  { id: '4', title: '압구정 VIP 룸 도우미', co: '압구정 VIP', region: '서울', jobType: '룸', pay: 600000, urgent: false, verified: true },
  { id: '5', title: '이태원 프리미엄 라운지', co: '이태원 라운지', region: '서울', jobType: '라운지', pay: 450000, urgent: false, verified: false },
  { id: '6', title: '대구 동성로 노래방 도우미', co: '동성로 노래방', region: '대구', jobType: '노래방', pay: 300000, urgent: true, verified: false },
];

export default function JobsPage() {
  const [region, setRegion] = useState('전체');
  const [jobType, setJobType] = useState('전체');
  const [sort, setSort] = useState('latest');

  const filtered = MOCK.filter(j => (region === '전체' || j.region === region) && (jobType === '전체' || j.jobType === jobType));

  const pill = (on: boolean) => `border rounded px-2.5 py-1 text-[11px] cursor-pointer transition ${on ? 'bg-[#1E3A5F] text-[#fff] border-[#1E3A5F]' : 'bg-white text-[#555] border-[#ddd] hover:border-[#1E3A5F]'}`;

  return (
    <div className="mx-auto max-w-[960px] px-3 py-4">
      <h1 className="text-[18px] font-bold mb-1">채용정보</h1>
      <p className="text-[12px] text-[#888] mb-3">총 <b className="text-[#333]">{filtered.length}</b> 건</p>

      <div className="flex gap-4 flex-col md:flex-row">
        {/* Sidebar filters */}
        <div className="md:w-[200px] shrink-0 space-y-3">
          <div>
            <p className="text-[12px] font-bold mb-1.5 text-[#333]">지역</p>
            <div className="flex flex-wrap gap-1">{REGIONS.map(r => <button key={r} onClick={() => setRegion(r)} className={pill(region === r)}>{r}</button>)}</div>
          </div>
          <div>
            <p className="text-[12px] font-bold mb-1.5 text-[#333]">업종</p>
            <div className="flex flex-wrap gap-1">{TYPES.map(t => <button key={t} onClick={() => setJobType(t)} className={pill(jobType === t)}>{t}</button>)}</div>
          </div>
          <div>
            <p className="text-[12px] font-bold mb-1.5 text-[#333]">정렬</p>
            <select value={sort} onChange={e => setSort(e.target.value)} className="w-full border border-[#ddd] rounded px-2 py-1.5 text-[12px] outline-none">
              <option value="latest">최신순</option>
              <option value="pay_high">급여 높은순</option>
              <option value="popular">인기순</option>
            </select>
          </div>
        </div>

        {/* Job list */}
        <div className="flex-1 space-y-2">
          {filtered.map(j => (
            <Link key={j.id} href={`/jobs/${j.id}/`} className="card flex gap-3 p-3 hover:border-[#1E3A5F] transition">
              <div className="w-[70px] h-[70px] shrink-0 bg-[#1E3A5F] rounded flex items-center justify-center">
                <span className="text-2xl">🦊</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 mb-0.5">
                  {j.urgent && <span className="tag bg-[#FFF3CD] text-[#856404] border border-[#FFEEBA]">급구</span>}
                  {j.verified && <span className="tag bg-[#D4EDDA] text-[#155724] border border-[#C3E6CB]">인증</span>}
                  <span className="tag bg-[#f0f0f0] text-[#666] border border-[#e0e0e0]">{j.jobType}</span>
                </div>
                <h3 className="text-[14px] font-bold truncate">{j.title}</h3>
                <p className="text-[11px] text-[#888]">{j.co}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="flex items-center gap-0.5 text-[11px] text-[#888]"><MapPin className="h-3 w-3" />{j.region}</span>
                  <span className="text-[14px] font-bold text-[#C9A961]">{j.pay.toLocaleString()}원/일</span>
                </div>
              </div>
            </Link>
          ))}
          {!filtered.length && <p className="text-center py-10 text-[#999]">조건에 맞는 공고가 없습니다.</p>}
        </div>
      </div>
    </div>
  );
}
