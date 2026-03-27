import Link from 'next/link';
import { MapPin } from 'lucide-react';

interface Props { id: string; title: string; region: string; jobType: string; payAmount: number; payType: string; companyName?: string; isUrgent?: boolean; isVerified?: boolean; }

function fmtPay(n: number, t: string) { return n.toLocaleString() + '원/' + (t === 'daily' ? '일' : t === 'hourly' ? '시' : '월'); }

export function JobCard({ id, title, region, jobType, payAmount, payType, companyName, isUrgent, isVerified }: Props) {
  return (
    <Link href={`/jobs/${id}/`} className="card card-hover flex gap-4 p-4">
      <div className="w-16 h-16 shrink-0 bg-[#1E3A5F] rounded-lg flex items-center justify-center"><span className="text-2xl">🦊</span></div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {isUrgent && <span className="tag tag-urgent">급구</span>}
          {isVerified && <span className="tag tag-verified">인증</span>}
          <span className="tag tag-type">{jobType}</span>
        </div>
        <h3 className="text-base font-bold truncate">{title}</h3>
        {companyName && <p className="text-xs text-[#999]">{companyName}</p>}
        <div className="flex items-center justify-between mt-1.5">
          <span className="flex items-center gap-1 text-xs text-[#999]"><MapPin className="h-3 w-3" />{region}</span>
          <span className="text-base font-bold text-[#C9A961]">{fmtPay(payAmount, payType)}</span>
        </div>
      </div>
    </Link>
  );
}
