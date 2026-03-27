'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="glass-header fixed left-0 right-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#4a7dff] to-[#7c5cfc] text-sm font-bold text-white">Y</div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-[#4a7dff]">여우</span>
            <span className="text-[#f0c040]">알바</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[{ href: '/jobs/', label: '알바찾기' }, { href: '/recommend/', label: '맞춤알바' }, { href: '/community/', label: '커뮤니티' }].map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3.5 py-2 text-sm text-[#7a8ba8] transition hover:bg-[#111d35] hover:text-[#dce4f0]">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button onClick={() => setSearchOpen(!searchOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7a8ba8] transition hover:bg-[#111d35] hover:text-white">
            <Search className="h-[18px] w-[18px]" />
          </button>
          <Link href="/my/" className="hidden h-9 w-9 items-center justify-center rounded-lg text-[#7a8ba8] transition hover:bg-[#111d35] hover:text-white md:flex">
            <Bell className="h-[18px] w-[18px]" />
          </Link>
          <Link href="/login/" className="hidden rounded-lg bg-gradient-to-r from-[#4a7dff] to-[#7c5cfc] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 md:block">
            로그인
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7a8ba8] transition hover:bg-[#111d35] md:hidden">
            {menuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-[#1e3050] px-4 py-3">
          <div className="mx-auto max-w-md">
            <div className="glass-sm flex items-center gap-2 px-3 py-2">
              <Search className="h-4 w-4 text-[#4a5d7a]" />
              <input type="text" placeholder="지역, 업종, 키워드 검색..." className="w-full bg-transparent text-sm text-[#dce4f0] outline-none placeholder:text-[#4a5d7a]" autoFocus />
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="border-t border-[#1e3050] px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {[{ href: '/jobs/', label: '알바찾기' }, { href: '/recommend/', label: '맞춤알바' }, { href: '/community/', label: '커뮤니티' }].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2.5 text-sm text-[#7a8ba8] hover:bg-[#111d35] hover:text-white" onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/login/" className="mt-2 rounded-lg bg-gradient-to-r from-[#4a7dff] to-[#7c5cfc] py-2.5 text-center text-sm font-medium text-white" onClick={() => setMenuOpen(false)}>
              로그인
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
