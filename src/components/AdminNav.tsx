'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface AdminMenuItem {
  href: string;
  label: string;
}

/** Admin section menu. `/admin` is active only on the dashboard itself; other items match by prefix. */
export default function AdminNav({ items }: { items: readonly AdminMenuItem[] }) {
  const pathname = usePathname() ?? '';

  return (
    <nav aria-label="관리자 메뉴" className="flex flex-wrap gap-x-4 gap-y-1">
      {items.map((item) => {
        const active =
          item.href === '/admin'
            ? pathname === '/admin' || pathname === '/admin/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'whitespace-nowrap text-sm transition-colors',
              active ? 'text-accent' : 'text-text-secondary hover:text-text',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
