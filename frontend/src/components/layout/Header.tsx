'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';

export function Header() {
  const [menu, setMenu] = useState(false);

  return (
    <header className="hdr fixed inset-x-0 top-0 z-50">
      {/* Top utility bar */}
      <div className="border-b border-[#1E3A5F]/15">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5">
          <p className="hidden text-[10px] text-[#C9A961] md:block">여성 전문 구인구직의 새로운 패러다임!</p>
          <div className="flex items-center gap-3 text-[11px] text-[#94A3B8] ml-auto">
            <Link href="/login/" className="hover:text-white">로그인</Link>
            <Link href="/register/" className="hover:text-white">회원가입</Link>
            <Link href="/post-job/" className="text-[#C9A961] font-medium hover:text-[#D4B872]">광고문의</Link>
          </div>
        </div>
      </div>

      {/* Logo + Search */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🦊</span>
          <span className="text-xl font-bold tracking-tight"><span className="text-[#F8FAFC]">여우</span><span className="text-[#C9A961]">알바</span></span>
        </Link>

        {/* Search (desktop) */}
        <div className="hidden flex-1 max-w-lg md:flex">
          <div className="flex w-full items-center rounded-lg border border-[#1E3A5F]/40 bg-[#112240]">
            <input type="text" placeholder="검색어를 입력하세요 (업소명/지역 등)" className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#64748B]" />
            <button className="flex h-9 w-10 items-center justify-center rounded-r-lg bg-[#1E3A5F] text-white"><Search className="h-4 w-4" /></button>
          </div>
        </div>

        {/* 고객센터 info (desktop) */}
        <div className="hidden shrink-0 text-right md:block">
          <p className="text-[10px] text-[#C9A961]">여우알바 고객센터</p>
          <p className="text-sm font-bold text-[#F8FAFC]">010-0000-0000</p>
          <p className="text-[9px] text-[#64748B]">상담시간 평일 10:00~18:00</p>
        </div>

        {/* Mobile buttons */}
        <div className="flex items-center gap-1 md:hidden">
          <Link href="/login/" className="text-[11px] text-[#94A3B8]">로그인</Link>
          <button onClick={() => setMenu(!menu)} className="h-8 w-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#112240]">
            {menu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menu && (
        <div className="border-t border-[#1E3A5F]/20 p-4 md:hidden">
          <div className="card-sm flex items-center gap-2 px-3 py-2 mb-3">
            <Search className="h-4 w-4 text-[#64748B]" />
            <input type="text" placeholder="검색..." className="w-full bg-transparent text-sm outline-none placeholder:text-[#64748B]" />
          </div>
          <nav className="flex flex-col gap-1">
            {[{ h: '/jobs/', l: '채용정보' }, { h: '/jobs/region/', l: '지역별채용' }, { h: '/reviews/', l: '광고후기' }, { h: '/talent/', l: '인재정보' }, { h: '/community/', l: '커뮤니티' }, { h: '/support/', l: '고객센터' }].map(m => (
              <Link key={m.h} href={m.h} className="rounded-lg px-3 py-2.5 text-sm text-[#94A3B8] hover:bg-[#112240] hover:text-white" onClick={() => setMenu(false)}>{m.l}</Link>
            ))}
            <Link href="/post-job/" className="btn btn-gold mt-2 py-2.5 text-center text-sm" onClick={() => setMenu(false)}>광고등록</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
