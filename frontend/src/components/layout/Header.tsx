'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Menu, X, ChevronDown } from 'lucide-react';

const MENUS = [
  { href: '/jobs/', label: '채용정보' },
  { href: '/jobs/region/', label: '지역별채용' },
  { href: '/reviews/', label: '광고후기' },
  { href: '/talent/', label: '인재정보' },
  { href: '/community/', label: '커뮤니티' },
  { href: '/support/', label: '고객센터' },
];

export function Header() {
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
    <header className="hdr fixed inset-x-0 top-0 z-50">
      {/* Top bar */}
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-lg">🦊</span>
          <span className="text-lg font-bold tracking-tight"><span className="text-[#F8FAFC]">여우</span><span className="text-[#C9A961]">알바</span></span>
        </Link>

        {/* Search bar (desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="card-sm flex w-full items-center gap-2 px-3 py-1.5">
            <Search className="h-4 w-4 text-[#64748B]" />
            <input type="text" placeholder="검색어를 입력하세요" className="w-full bg-transparent text-sm outline-none placeholder:text-[#64748B]" />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setSearch(!search)} className="h-8 w-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#112240] md:hidden">
            <Search className="h-4 w-4" />
          </button>
          <Link href="/login/" className="hidden text-xs text-[#94A3B8] hover:text-white md:block">로그인</Link>
          <span className="hidden text-[#1E3A5F] md:block">|</span>
          <Link href="/register/" className="hidden text-xs text-[#94A3B8] hover:text-white md:block">회원가입</Link>
          <Link href="/post-job/" className="btn btn-gold hidden px-3 py-1.5 text-xs md:block">광고등록</Link>
          <button onClick={() => setMenu(!menu)} className="h-8 w-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#112240] md:hidden">
            {menu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Menu bar (desktop) */}
      <div className="hidden md:block border-t border-[#1E3A5F]/20">
        <nav className="mx-auto flex max-w-6xl items-center justify-center gap-1 px-4 py-1">
          {MENUS.map(m => (
            <Link key={m.href} href={m.href} className="rounded-lg px-4 py-2 text-sm text-[#94A3B8] transition hover:bg-[#112240] hover:text-white">{m.label}</Link>
          ))}
        </nav>
      </div>

      {/* Mobile search */}
      {search && (
        <div className="border-t border-[#1E3A5F]/20 px-4 py-2 md:hidden">
          <div className="card-sm flex items-center gap-2 px-3 py-2">
            <Search className="h-4 w-4 text-[#64748B]" />
            <input type="text" placeholder="검색어를 입력하세요" className="w-full bg-transparent text-sm outline-none placeholder:text-[#64748B]" autoFocus />
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {menu && (
        <div className="border-t border-[#1E3A5F]/20 p-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {MENUS.map(m => (
              <Link key={m.href} href={m.href} className="rounded-lg px-3 py-2.5 text-sm text-[#94A3B8] hover:bg-[#112240] hover:text-white" onClick={() => setMenu(false)}>{m.label}</Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Link href="/login/" className="btn btn-navy flex-1 py-2 text-center text-sm" onClick={() => setMenu(false)}>로그인</Link>
              <Link href="/post-job/" className="btn btn-gold flex-1 py-2 text-center text-sm" onClick={() => setMenu(false)}>광고등록</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
