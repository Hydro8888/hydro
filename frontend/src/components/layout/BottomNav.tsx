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
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-[#e0e0e0] md:hidden">
      <div className="flex items-center justify-around py-1.5">
        {NAV.map(({ href, label, Icon }) => {
          const on = p === href || p === href.slice(0, -1) || (href !== '/' && p.startsWith(href));
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 py-1 px-3">
              <Icon className={`h-5 w-5 ${on ? 'text-[#1E3A5F]' : 'text-[#999]'}`} />
              <span className={`text-xs ${on ? 'font-bold text-[#1E3A5F]' : 'text-[#999]'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
