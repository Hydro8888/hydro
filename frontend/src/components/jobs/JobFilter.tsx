'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];

interface Props { selectedRegion: string; selectedJobType: string; onRegionChange: (r: string) => void; onJobTypeChange: (t: string) => void; }

export function JobFilter({ selectedRegion, selectedJobType, onRegionChange, onJobTypeChange }: Props) {
  const [open, setOpen] = useState(false);
  const cnt = [selectedRegion, selectedJobType].filter(Boolean).length;

  return (
    <div className="lg:hidden">
      <button onClick={() => setOpen(true)} className="btn btn-outline px-3 py-2 text-sm gap-1.5">
        <SlidersHorizontal className="h-4 w-4" /> 필터
        {cnt > 0 && <span className="bg-[#C9A961] text-[#ffffff] rounded-full px-1.5 py-0.5 text-xs">{cnt}</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30" onClick={() => setOpen(false)}>
          <div className="w-full rounded-t-2xl bg-white p-5 border-t border-[#e0e0e0]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">필터</h3><button onClick={() => setOpen(false)}><X className="h-5 w-5 text-[#999]" /></button></div>
            <p className="text-sm font-bold mb-2">지역</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button onClick={() => onRegionChange('')} className={`pill ${!selectedRegion ? 'pill-active' : ''}`}>전체</button>
              {REGIONS.map(r => <button key={r} onClick={() => onRegionChange(r)} className={`pill ${selectedRegion === r ? 'pill-active' : ''}`}>{r}</button>)}
            </div>
            <p className="text-sm font-bold mb-2">업종</p>
            <div className="flex flex-wrap gap-1.5 mb-5">
              <button onClick={() => onJobTypeChange('')} className={`pill ${!selectedJobType ? 'pill-active' : ''}`}>전체</button>
              {TYPES.map(t => <button key={t} onClick={() => onJobTypeChange(t)} className={`pill ${selectedJobType === t ? 'pill-active' : ''}`}>{t}</button>)}
            </div>
            <button onClick={() => setOpen(false)} className="btn btn-navy w-full py-3">적용</button>
          </div>
        </div>
      )}
    </div>
  );
}
