'use client';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const JOB_TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];

interface Props { selectedRegion?: string; selectedJobType?: string; onRegionChange: (r: string) => void; onJobTypeChange: (t: string) => void; }

export function Sidebar({ selectedRegion, selectedJobType, onRegionChange, onJobTypeChange }: Props) {
  return (
    <aside className="glass hidden w-60 shrink-0 p-4 lg:block">
      <div className="mb-5">
        <h3 className="mb-2 text-sm font-semibold text-[#f0c040]">지역</h3>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => onRegionChange('')} className={`rounded-lg px-2.5 py-1 text-xs ${!selectedRegion ? 'bg-[#4a7dff] text-white' : 'bg-[#111d35] text-[#7a8ba8] hover:text-white'}`}>전체</button>
          {REGIONS.map((r) => (
            <button key={r} onClick={() => onRegionChange(r)} className={`rounded-lg px-2.5 py-1 text-xs ${selectedRegion === r ? 'bg-[#4a7dff] text-white' : 'bg-[#111d35] text-[#7a8ba8] hover:text-white'}`}>{r}</button>
          ))}
        </div>
      </div>
      <div className="mb-5">
        <h3 className="mb-2 text-sm font-semibold text-[#f0c040]">업종</h3>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => onJobTypeChange('')} className={`rounded-lg px-2.5 py-1 text-xs ${!selectedJobType ? 'bg-[#4a7dff] text-white' : 'bg-[#111d35] text-[#7a8ba8] hover:text-white'}`}>전체</button>
          {JOB_TYPES.map((t) => (
            <button key={t} onClick={() => onJobTypeChange(t)} className={`rounded-lg px-2.5 py-1 text-xs ${selectedJobType === t ? 'bg-[#4a7dff] text-white' : 'bg-[#111d35] text-[#7a8ba8] hover:text-white'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-[#f0c040]">정렬</h3>
        <select className="w-full rounded-lg border border-[#1e3050] bg-[#111d35] px-3 py-2 text-sm text-[#7a8ba8] outline-none focus:border-[#4a7dff]">
          <option value="latest">최신순</option>
          <option value="pay_high">급여 높은순</option>
          <option value="popular">인기순</option>
        </select>
      </div>
    </aside>
  );
}
