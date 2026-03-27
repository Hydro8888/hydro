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
  const formatted = new Intl.NumberFormat('ko-KR').format(amount);
  const typeLabel = type === 'daily' ? '일' : type === 'hourly' ? '시' : '월';
  return `${formatted}원/${typeLabel}`;
}

export function JobCard({ id, title, region, jobType, payAmount, payType, companyName, isUrgent, isVerified, rank }: JobCardProps) {
  return (
    <Link
      href={`/jobs/${id}/`}
      className="glass group flex items-center gap-4 p-4 transition-all hover:border-[var(--border-active)] hover:bg-[var(--bg-card-hover)]"
    >
      {rank && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-card)] text-sm font-bold text-[var(--text-secondary)]">
          {rank}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isUrgent && (
            <span className="shrink-0 rounded-md bg-[var(--danger)]/20 px-1.5 py-0.5 text-[10px] font-medium text-[var(--danger)]">급구</span>
          )}
          {isVerified && (
            <span className="shrink-0 rounded-md bg-[var(--accent-green)]/20 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-green)]">인증</span>
          )}
          <h3 className="truncate text-sm font-medium group-hover:text-[var(--accent-blue-light)]">{title}</h3>
        </div>
        {companyName && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{companyName}</p>}
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{region}</p>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-sm font-bold text-[var(--accent-gold)]">{formatPay(payAmount, payType)}</span>
        <span className="block text-[10px] text-[var(--text-muted)]">{jobType}</span>
      </div>
    </Link>
  );
}
