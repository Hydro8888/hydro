'use client';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const JOB_TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];

interface SidebarProps {
  selectedRegion?: string;
  selectedJobType?: string;
  onRegionChange: (region: string) => void;
  onJobTypeChange: (jobType: string) => void;
}

export function Sidebar({ selectedRegion, selectedJobType, onRegionChange, onJobTypeChange }: SidebarProps) {
  return (
    <aside className="hidden w-64 shrink-0 rounded-xl border border-border bg-card p-5 lg:block">
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-accent">지역</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onRegionChange('')}
            className={`rounded-full px-3 py-1 text-xs transition-all ${
              !selectedRegion ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            전체
          </button>
          {REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => onRegionChange(region)}
              className={`rounded-full px-3 py-1 text-xs transition-all ${
                selectedRegion === region ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-accent">업종</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onJobTypeChange('')}
            className={`rounded-full px-3 py-1 text-xs transition-all ${
              !selectedJobType ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            전체
          </button>
          {JOB_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onJobTypeChange(type)}
              className={`rounded-full px-3 py-1 text-xs transition-all ${
                selectedJobType === type ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-accent">정렬</h3>
        <select className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm outline-none focus:border-primary">
          <option value="latest">최신순</option>
          <option value="pay_high">급여 높은순</option>
          <option value="pay_low">급여 낮은순</option>
          <option value="popular">인기순</option>
        </select>
      </div>
    </aside>
  );
}
