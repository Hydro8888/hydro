'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, MessageCircle, PenSquare, User } from 'lucide-react';

const NAV = [
  { href: '/', label: '홈', Icon: Home },
  { href: '/jobs/', label: '채용', Icon: Briefcase },
  { href: '/community/', label: '커뮤니티', Icon: MessageCircle },
  { href: '/post-job/', label: '광고등록', Icon: PenSquare },
  { href: '/my/', label: '마이', Icon: User },
];

export function BottomNav() {
  const p = usePathname();
  return (
    <nav className="hdr fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around py-1">
        {NAV.map(({ href, label, Icon }) => {
          const on = p === href || p === href.slice(0, -1) || (href !== '/' && p.startsWith(href));
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 py-1.5 px-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${on ? 'bg-[#1E3A5F] shadow-md shadow-[#1E3A5F]/30' : ''}`}>
                <Icon className={`h-[18px] w-[18px] ${on ? 'text-white' : 'text-[#64748B]'}`} />
              </div>
              <span className={`text-[10px] ${on ? 'font-semibold text-[#C9A961]' : 'text-[#64748B]'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
