import Link from 'next/link';

interface JobCardProps {
  id: string;
  title: string;
  region: string;
  jobType: string;
  payAmount: number;
  payType: string;
  companyName?: string;
  isUrgent?: boolean;
  isVerified?: boolean;
  rank?: number;
}

function formatPay(amount: number, type: string) {
  const f = new Intl.NumberFormat('ko-KR').format(amount);
  return `${f}원/${type === 'daily' ? '일' : type === 'hourly' ? '시' : '월'}`;
}

export function JobCard({ id, title, region, jobType, payAmount, payType, companyName, isUrgent, isVerified, rank }: JobCardProps) {
  return (
    <Link href={`/jobs/${id}/`} className="glass-sm flex items-center gap-3 px-4 py-3 transition hover:bg-[#1a2a4a]/60">
      {rank && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#111d35] text-sm font-bold text-[#7a8ba8]">{rank}</span>}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {isUrgent && <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-400">급구</span>}
          {isVerified && <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">인증</span>}
          <h3 className="truncate text-sm font-medium">{title}</h3>
        </div>
        {companyName && <p className="text-[11px] text-[#4a5d7a]">{companyName}</p>}
        <p className="text-[11px] text-[#4a5d7a]">{region}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-[#f0c040]">{formatPay(payAmount, payType)}</p>
        <p className="text-[10px] text-[#4a5d7a]">{jobType}</p>
      </div>
    </Link>
  );
}
