'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: '홈', href: '/' },
  { label: '서비스 소개', href: '/services' },
  { label: '우수 사례', href: '/cases' },
  { label: '안전·신뢰', href: '/safety' },
  { label: '요금 안내', href: '/pricing' },
  { label: '헬퍼 지원', href: '/helper-apply' },
  { label: '고객지원', href: '/support' },
];

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/simburum') {
      return pathname === '/simburum' || pathname === '/simburum/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="hidden lg:flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              active
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50',
            ].join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
