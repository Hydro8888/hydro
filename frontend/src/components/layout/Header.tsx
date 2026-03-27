'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Menu, X, Briefcase, MapPin, Star, Users, MessageCircle, Headphones } from 'lucide-react';

const NAV = [
  { href: '/jobs/', icon: Briefcase, label: '채용정보' },
  { href: '/jobs/region/', icon: MapPin, label: '지역별채용' },
  { href: '/reviews/', icon: Star, label: '광고후기' },
  { href: '/talent/', icon: Users, label: '인재정보' },
  { href: '/community/', icon: MessageCircle, label: '커뮤니티' },
  { href: '/support/', icon: Headphones, label: '고객센터' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white border-b border-[#e0e0e0]">
      {/* Utility bar */}
      <div className="border-b border-[#f0f0f0]">
        <div className="mx-auto max-w-[960px] px-4 py-1.5 flex items-center justify-between">
          <p className="hidden md:block text-xs text-[#999]">여성 전문 구인구직의 새로운 패러다임</p>
          <div className="flex items-center gap-4 text-xs text-[#666] ml-auto">
            <Link href="/login/" className="hover:text-[#222]">로그인</Link>
            <Link href="/register/" className="hover:text-[#222]">회원가입</Link>
            <Link href="/post-job/" className="font-bold text-[#C9A961] hover:text-[#b89a55]">광고문의</Link>
          </div>
        </div>
      </div>

      {/* Logo + Search + Contact */}
      <div className="mx-auto max-w-[960px] px-4 py-3 flex items-center gap-4">
        <Link href="/" className="shrink-0 flex items-center gap-2">
          <span className="text-2xl">🦊</span>
          <span className="text-xl font-bold tracking-tight"><span className="text-[#1E3A5F]">여우</span><span className="text-[#C9A961]">알바</span></span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-[420px]">
          <div className="flex w-full border border-[#e0e0e0] rounded-lg overflow-hidden focus-within:border-[#1E3A5F]">
            <input type="text" placeholder="검색어를 입력하세요 (업소명, 지역 등)" className="flex-1 px-3 py-2 text-sm outline-none" />
            <button className="px-4 bg-[#1E3A5F] text-[#ffffff]"><Search className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="hidden md:flex ml-auto shrink-0 items-center gap-3">
          <div className="text-right border border-[#e0e0e0] rounded-lg px-3 py-1.5">
            <p className="text-xs text-[#C9A961] font-bold">고객센터</p>
            <p className="text-base font-bold text-[#222]">010-0000-0000</p>
            <p className="text-xs text-[#999]">평일 10:00~18:00</p>
          </div>
          <Link href="/post-job/" className="btn btn-navy px-4 py-3 text-sm">
            <div className="text-center leading-tight">
              <span className="block font-bold">광고등록</span>
              <span className="block text-xs text-[#C9A961] font-normal">이력서 무료등록</span>
            </div>
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="ml-auto md:hidden p-2 text-[#666] hover:text-[#222]">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Icon nav bar */}
      <div className="bg-[#1E3A5F]">
        <div className="mx-auto max-w-[960px] flex items-center justify-around py-2.5 px-2">
          {NAV.map(({ href, icon: I, label }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-2 group">
              <I className="h-5 w-5 md:h-6 md:w-6 text-[#ffffff] opacity-85 group-hover:opacity-100" />
              <span className="text-xs text-[#ffffff] opacity-85 group-hover:opacity-100 font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-[#e0e0e0] bg-white p-4">
          <div className="flex border border-[#e0e0e0] rounded-lg overflow-hidden mb-3">
            <input type="text" placeholder="검색..." className="flex-1 px-3 py-2 text-sm outline-none" />
            <button className="px-3 bg-[#1E3A5F] text-[#ffffff]"><Search className="h-4 w-4" /></button>
          </div>
          <nav className="space-y-0.5">
            {NAV.map(m => (
              <Link key={m.href} href={m.href} className="block px-3 py-2.5 text-sm text-[#666] hover:bg-[#f7f8fa] hover:text-[#222] rounded-lg" onClick={() => setOpen(false)}>{m.label}</Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link href="/login/" className="btn btn-outline flex-1 py-2.5" onClick={() => setOpen(false)}>로그인</Link>
              <Link href="/post-job/" className="btn btn-gold flex-1 py-2.5" onClick={() => setOpen(false)}>광고등록</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
