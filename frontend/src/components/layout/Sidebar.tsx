'use client';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];

interface Props { selectedRegion?: string; selectedJobType?: string; onRegionChange: (r: string) => void; onJobTypeChange: (t: string) => void; }

export function Sidebar({ selectedRegion, selectedJobType, onRegionChange, onJobTypeChange }: Props) {
  const pill = (on: boolean) => `rounded-lg px-2.5 py-1 text-xs transition ${on ? 'bg-[#1E3A5F] text-white' : 'bg-[#112240] text-[#94A3B8] hover:text-white'}`;
  return (
    <aside className="card hidden w-56 shrink-0 p-4 lg:block">
      <h3 className="mb-2 text-xs font-semibold text-[#C9A961]">지역</h3>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button onClick={() => onRegionChange('')} className={pill(!selectedRegion)}>전체</button>
        {REGIONS.map(r => <button key={r} onClick={() => onRegionChange(r)} className={pill(selectedRegion === r)}>{r}</button>)}
      </div>
      <h3 className="mb-2 text-xs font-semibold text-[#C9A961]">업종</h3>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button onClick={() => onJobTypeChange('')} className={pill(!selectedJobType)}>전체</button>
        {TYPES.map(t => <button key={t} onClick={() => onJobTypeChange(t)} className={pill(selectedJobType === t)}>{t}</button>)}
      </div>
      <h3 className="mb-2 text-xs font-semibold text-[#C9A961]">정렬</h3>
      <select className="w-full rounded-lg border border-[#1E3A5F]/30 bg-[#112240] px-3 py-2 text-sm text-[#94A3B8] outline-none focus:border-[#1E3A5F]">
        <option>최신순</option><option>급여 높은순</option><option>인기순</option>
      </select>
    </aside>
  );
}
