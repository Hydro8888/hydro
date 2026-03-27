'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const JOB_TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];

interface JobFilterProps {
  selectedRegion: string;
  selectedJobType: string;
  onRegionChange: (region: string) => void;
  onJobTypeChange: (jobType: string) => void;
}

export function JobFilter({ selectedRegion, selectedJobType, onRegionChange, onJobTypeChange }: JobFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm transition-all hover:border-primary"
      >
        <SlidersHorizontal className="h-4 w-4" />
        필터
        {(selectedRegion || selectedJobType) && (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">
            {[selectedRegion, selectedJobType].filter(Boolean).length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setIsOpen(false)}>
          <div
            className="w-full rounded-t-2xl border-t border-border bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">필터</h3>
              <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <h4 className="mb-2 text-sm font-medium text-accent">지역</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onRegionChange('')}
                  className={`rounded-full px-3 py-1.5 text-xs ${!selectedRegion ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                >
                  전체
                </button>
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => onRegionChange(r)}
                    className={`rounded-full px-3 py-1.5 text-xs ${selectedRegion === r ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="mb-2 text-sm font-medium text-accent">업종</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onJobTypeChange('')}
                  className={`rounded-full px-3 py-1.5 text-xs ${!selectedJobType ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                >
                  전체
                </button>
                {JOB_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => onJobTypeChange(t)}
                    className={`rounded-full px-3 py-1.5 text-xs ${selectedJobType === t ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white"
            >
              적용하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
