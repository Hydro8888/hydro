import Link from 'next/link';
import { MapPin } from 'lucide-react';

interface Props {
  id: string; title: string; region: string; jobType: string;
  payAmount: number; payType: string; companyName?: string;
  isUrgent?: boolean; isVerified?: boolean;
}

function fmtPay(n: number, t: string) {
  return new Intl.NumberFormat('ko-KR').format(n) + '원/' + (t === 'daily' ? '일' : t === 'hourly' ? '시' : '월');
}

export function JobCard({ id, title, region, jobType, payAmount, payType, companyName, isUrgent, isVerified }: Props) {
  return (
    <Link href={`/jobs/${id}/`} className="card-sm group flex gap-3 p-3.5 transition hover:border-[#e85d8a]/30">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#1e142a] to-[#2a1e3a]">
        <div className="flex h-full items-center justify-center text-2xl opacity-40">🦊</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1">
          {isUrgent && <span className="tag bg-[#ff6b6b]/15 text-[#ff6b6b]">급구</span>}
          {isVerified && <span className="tag bg-[#4ade80]/15 text-[#4ade80]">인증</span>}
          <span className="tag bg-[#1e142a] text-[#9a8aa8]">{jobType}</span>
        </div>
        <h3 className="truncate text-sm font-semibold group-hover:text-[#e85d8a]">{title}</h3>
        {companyName && <p className="mt-0.5 text-xs text-[#6a5a7a]">{companyName}</p>}
        <div className="mt-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-[#9a8aa8]"><MapPin className="h-3 w-3" />{region}</span>
          <span className="text-sm font-bold text-[#d4a76a]">{fmtPay(payAmount, payType)}</span>
        </div>
      </div>
    </Link>
  );
}
