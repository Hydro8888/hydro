'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Sparkles, MessageCircle, User } from 'lucide-react';

const NAV = [
  { href: '/', label: '홈', icon: Home },
  { href: '/jobs/', label: '알바', icon: Briefcase },
  { href: '/recommend/', label: '맞춤', icon: Sparkles },
  { href: '/community/', label: '톡', icon: MessageCircle },
  { href: '/my/', label: '마이', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-header fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around py-1.5">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname === item.href.slice(0, -1) || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-2 py-1">
              {active ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a7dff] to-[#7c5cfc] shadow-lg shadow-[#4a7dff]/30" style={{ transform: 'rotate(45deg)' }}>
                  <Icon className="h-[18px] w-[18px] text-white" style={{ transform: 'rotate(-45deg)' }} />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center">
                  <Icon className="h-5 w-5 text-[#4a5d7a]" />
                </div>
              )}
              <span className={`text-[10px] ${active ? 'font-semibold text-[#6b9aff]' : 'text-[#4a5d7a]'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
