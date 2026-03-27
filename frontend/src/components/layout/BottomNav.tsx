'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Sparkles, MessageCircle, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/jobs/', label: '알바찾기', icon: Briefcase },
  { href: '/recommend/', label: '맞춤', icon: Sparkles },
  { href: '/community/', label: '커뮤니티', icon: MessageCircle },
  { href: '/my/', label: '마이', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong md:hidden">
      <div className="flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            pathname === item.href.slice(0, -1) ||
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-3 py-1">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] shadow-lg shadow-[var(--accent-blue)]/30 -translate-y-1'
                    : 'text-[var(--text-muted)]'
                }`}
                style={isActive ? { transform: 'rotate(45deg) translateY(-4px)' } : {}}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? 'text-white' : ''}`}
                  style={isActive ? { transform: 'rotate(-45deg)' } : {}}
                />
              </div>
              <span className={`text-[10px] ${isActive ? 'font-semibold text-[var(--accent-blue-light)]' : 'text-[var(--text-muted)]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
