'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Sparkles, MessageCircle, User } from 'lucide-react';

const NAV = [
  { href: '/', label: '홈', Icon: Home },
  { href: '/jobs/', label: '알바', Icon: Briefcase },
  { href: '/recommend/', label: '맞춤', Icon: Sparkles },
  { href: '/community/', label: '톡', Icon: MessageCircle },
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
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${on ? 'bg-gradient-to-br from-[#e85d8a] to-[#c44dbb] shadow-md shadow-[#e85d8a]/25' : ''}`}>
                <Icon className={`h-[18px] w-[18px] ${on ? 'text-white' : 'text-[#6a5a7a]'}`} />
              </div>
              <span className={`text-[10px] ${on ? 'font-semibold text-[#e85d8a]' : 'text-[#6a5a7a]'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
