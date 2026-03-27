import Link from 'next/link';
import { MapPin } from 'lucide-react';

interface Props { id: string; title: string; region: string; jobType: string; payAmount: number; payType: string; companyName?: string; isUrgent?: boolean; isVerified?: boolean; }

function fmtPay(n: number, t: string) { return new Intl.NumberFormat('ko-KR').format(n) + '원/' + (t === 'daily' ? '일' : t === 'hourly' ? '시' : '월'); }

export function JobCard({ id, title, region, jobType, payAmount, payType, companyName, isUrgent, isVerified }: Props) {
  return (
    <Link href={`/jobs/${id}/`} className="card-sm group flex gap-3 p-3.5 transition hover:border-[#1E3A5F]/60">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#112240]">
        <div className="flex h-full items-center justify-center text-2xl opacity-30">🦊</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1">
          {isUrgent && <span className="tag bg-[#F59E0B]/15 text-[#F59E0B]">급구</span>}
          {isVerified && <span className="tag bg-[#10B981]/15 text-[#10B981]">인증</span>}
          <span className="tag bg-[#1E3A5F]/20 text-[#94A3B8]">{jobType}</span>
        </div>
        <h3 className="truncate text-sm font-semibold group-hover:text-[#C9A961]">{title}</h3>
        {companyName && <p className="mt-0.5 text-xs text-[#64748B]">{companyName}</p>}
        <div className="mt-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-[#94A3B8]"><MapPin className="h-3 w-3" />{region}</span>
          <span className="text-sm font-bold text-[#C9A961]">{fmtPay(payAmount, payType)}</span>
        </div>
      </div>
    </Link>
  );
}
