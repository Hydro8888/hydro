'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';

export function Header() {
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
    <header className="hdr fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg">🦊</span>
          <span className="text-lg font-bold tracking-tight"><span className="text-[#e85d8a]">여우</span><span className="text-[#d4a76a]">알바</span></span>
        </Link>

        <nav className="hidden gap-5 md:flex">
          {[{ h: '/jobs/', l: '알바찾기' }, { h: '/recommend/', l: '맞춤알바' }, { h: '/community/', l: '커뮤니티' }].map(i => (
            <Link key={i.h} href={i.h} className="text-sm text-[#9a8aa8] transition hover:text-[#f0e8f0]">{i.l}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button onClick={() => setSearch(!search)} className="h-9 w-9 rounded-lg flex items-center justify-center text-[#9a8aa8] hover:bg-[#1e142a] hover:text-white">
            <Search className="h-[18px] w-[18px]" />
          </button>
          <Link href="/login/" className="btn-primary hidden px-4 py-1.5 text-sm md:block">로그인</Link>
          <button onClick={() => setMenu(!menu)} className="h-9 w-9 rounded-lg flex items-center justify-center text-[#9a8aa8] hover:bg-[#1e142a] md:hidden">
            {menu ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      {search && (
        <div className="border-t border-[#2a1e3a] px-4 py-2.5">
          <div className="card-sm mx-auto flex max-w-md items-center gap-2 px-3 py-2">
            <Search className="h-4 w-4 text-[#6a5a7a]" />
            <input type="text" placeholder="지역, 업종, 키워드..." className="w-full bg-transparent text-sm outline-none placeholder:text-[#6a5a7a]" autoFocus />
          </div>
        </div>
      )}

      {menu && (
        <div className="border-t border-[#2a1e3a] p-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {[{ h: '/jobs/', l: '알바찾기' }, { h: '/recommend/', l: '맞춤알바' }, { h: '/community/', l: '커뮤니티' }].map(i => (
              <Link key={i.h} href={i.h} className="rounded-lg px-3 py-2.5 text-sm text-[#9a8aa8] hover:bg-[#1e142a] hover:text-white" onClick={() => setMenu(false)}>{i.l}</Link>
            ))}
            <Link href="/login/" className="btn-primary mt-2 py-2.5 text-center text-sm" onClick={() => setMenu(false)}>로그인</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
