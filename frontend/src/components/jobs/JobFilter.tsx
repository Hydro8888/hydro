'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];

interface Props { selectedRegion: string; selectedJobType: string; onRegionChange: (r: string) => void; onJobTypeChange: (t: string) => void; }

export function JobFilter({ selectedRegion, selectedJobType, onRegionChange, onJobTypeChange }: Props) {
  const [open, setOpen] = useState(false);
  const cnt = [selectedRegion, selectedJobType].filter(Boolean).length;
  const pill = (on: boolean) => `rounded-lg px-3 py-1.5 text-xs ${on ? 'bg-[#e85d8a] text-white' : 'bg-[#1e142a] text-[#9a8aa8]'}`;

  return (
    <div className="lg:hidden">
      <button onClick={() => setOpen(true)} className="card-sm flex items-center gap-1.5 px-3 py-2 text-sm text-[#9a8aa8]">
        <SlidersHorizontal className="h-4 w-4" /> 필터
        {cnt > 0 && <span className="rounded-full bg-[#e85d8a] px-1.5 text-[10px] text-white">{cnt}</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setOpen(false)}>
          <div className="w-full rounded-t-2xl border-t border-[#2a1e3a] bg-[#120b18] p-5" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">필터</h3>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5 text-[#9a8aa8]" /></button>
            </div>
            <h4 className="mb-2 text-xs font-semibold text-[#d4a76a]">지역</h4>
            <div className="mb-4 flex flex-wrap gap-1.5">
              <button onClick={() => onRegionChange('')} className={pill(!selectedRegion)}>전체</button>
              {REGIONS.map(r => <button key={r} onClick={() => onRegionChange(r)} className={pill(selectedRegion === r)}>{r}</button>)}
            </div>
            <h4 className="mb-2 text-xs font-semibold text-[#d4a76a]">업종</h4>
            <div className="mb-4 flex flex-wrap gap-1.5">
              <button onClick={() => onJobTypeChange('')} className={pill(!selectedJobType)}>전체</button>
              {TYPES.map(t => <button key={t} onClick={() => onJobTypeChange(t)} className={pill(selectedJobType === t)}>{t}</button>)}
            </div>
            <button onClick={() => setOpen(false)} className="btn-primary w-full py-3 text-sm">적용</button>
          </div>
        </div>
      )}
    </div>
  );
}
