'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const ADMIN_NAV = [
  { href: '/admin', label: '통계 대시보드' },
  { href: '/admin/users', label: '사용자 관리' },
  { href: '/admin/ai-queue', label: 'AI 검토 대기' },
  { href: '/admin/disputes', label: '분쟁 관리' },
  { href: '/admin/cases', label: '성공 사례' },
  { href: '/admin/content', label: '콘텐츠 관리' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const user = session?.user as { role?: string } | undefined;

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || user?.role !== 'ADMIN') {
    router.push('/login');
    return null;
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-[80vh]">
      <div className="bg-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <span className="text-sm font-bold">관리자 패널</span>
            <Link href="/dashboard" className="text-xs text-red-200 hover:text-white transition-colors">
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive(item.href)
                  ? 'bg-red-50 text-red-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}
