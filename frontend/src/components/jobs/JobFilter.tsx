'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const JOB_TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];

interface Props { selectedRegion: string; selectedJobType: string; onRegionChange: (r: string) => void; onJobTypeChange: (t: string) => void; }

export function JobFilter({ selectedRegion, selectedJobType, onRegionChange, onJobTypeChange }: Props) {
  const [open, setOpen] = useState(false);
  const count = [selectedRegion, selectedJobType].filter(Boolean).length;

  return (
    <div className="lg:hidden">
      <button onClick={() => setOpen(true)} className="glass-sm flex items-center gap-2 px-3 py-2 text-sm text-[#7a8ba8] transition hover:text-white">
        <SlidersHorizontal className="h-4 w-4" /> 필터
        {count > 0 && <span className="rounded-full bg-[#4a7dff] px-1.5 py-0.5 text-[10px] text-white">{count}</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setOpen(false)}>
          <div className="w-full rounded-t-2xl border-t border-[#1e3050] bg-[#0e1a30] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">필터</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-[#111d35]"><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-5">
              <h4 className="mb-2 text-sm font-medium text-[#f0c040]">지역</h4>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => onRegionChange('')} className={`rounded-lg px-3 py-1.5 text-xs ${!selectedRegion ? 'bg-[#4a7dff] text-white' : 'bg-[#111d35] text-[#7a8ba8]'}`}>전체</button>
                {REGIONS.map((r) => (
                  <button key={r} onClick={() => onRegionChange(r)} className={`rounded-lg px-3 py-1.5 text-xs ${selectedRegion === r ? 'bg-[#4a7dff] text-white' : 'bg-[#111d35] text-[#7a8ba8]'}`}>{r}</button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <h4 className="mb-2 text-sm font-medium text-[#f0c040]">업종</h4>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => onJobTypeChange('')} className={`rounded-lg px-3 py-1.5 text-xs ${!selectedJobType ? 'bg-[#4a7dff] text-white' : 'bg-[#111d35] text-[#7a8ba8]'}`}>전체</button>
                {JOB_TYPES.map((t) => (
                  <button key={t} onClick={() => onJobTypeChange(t)} className={`rounded-lg px-3 py-1.5 text-xs ${selectedJobType === t ? 'bg-[#4a7dff] text-white' : 'bg-[#111d35] text-[#7a8ba8]'}`}>{t}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-full rounded-xl bg-gradient-to-r from-[#4a7dff] to-[#7c5cfc] py-3 text-sm font-semibold text-white">적용</button>
          </div>
        </div>
      )}
    </div>
  );
}
