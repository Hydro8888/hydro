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
  images?: string[];
}

function formatPay(amount: number, type: string) {
  const formatted = new Intl.NumberFormat('ko-KR').format(amount);
  const typeLabel = type === 'daily' ? '일' : type === 'hourly' ? '시' : '월';
  return `${formatted}원/${typeLabel}`;
}

export function JobCard({ id, title, region, jobType, payAmount, payType, companyName, isUrgent, isVerified }: JobCardProps) {
  return (
    <Link
      href={`/jobs/${id}`}
      className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            {isUrgent && (
              <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-medium text-destructive">
                급구
              </span>
            )}
            {isVerified && (
              <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-medium text-success">
                인증업소
              </span>
            )}
          </div>
          <h3 className="font-semibold group-hover:text-primary-light">{title}</h3>
          {companyName && <p className="mt-0.5 text-xs text-muted-foreground">{companyName}</p>}
          <p className="mt-1 text-sm text-muted-foreground">{region}</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{jobType}</span>
      </div>
      <div className="mt-3">
        <span className="text-lg font-bold text-accent">{formatPay(payAmount, payType)}</span>
      </div>
    </Link>
  );
}
