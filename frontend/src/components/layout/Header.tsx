'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Menu, X, Briefcase, MapPin, Star, Users, MessageCircle, Headphones } from 'lucide-react';

const ICONS = [
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
    <header className="bg-white border-b border-[#ddd]">
      {/* Row 1: Utility */}
      <div className="border-b border-[#eee]">
        <div className="mx-auto max-w-[960px] px-3 py-1 flex items-center justify-between">
          <p className="hidden md:block text-[11px] text-[#E91E63] font-medium">여성 전문 구인구직의 새로운 패러다임!</p>
          <div className="flex items-center gap-3 text-[11px] text-[#666] ml-auto">
            <Link href="/login/" className="hover:text-[#333]">로그인</Link>
            <Link href="/register/" className="hover:text-[#333]">회원가입</Link>
            <Link href="/post-job/" className="text-[#E91E63] font-bold hover:underline">광고문의</Link>
          </div>
        </div>
      </div>

      {/* Row 2: Logo + Search + Contact */}
      <div className="mx-auto max-w-[960px] px-3 py-2 flex items-center gap-4">
        <Link href="/" className="shrink-0 flex items-center gap-1.5">
          <span className="text-xl">🦊</span>
          <span className="text-xl font-bold"><span className="text-[#1E3A5F]">여우</span><span className="text-[#C9A961]">알바</span></span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-[400px]">
          <div className="flex w-full border border-[#1E3A5F] rounded overflow-hidden">
            <input type="text" placeholder="검색어를 입력하세요" className="flex-1 px-3 py-1.5 text-[13px] outline-none" />
            <button className="px-3 bg-[#1E3A5F] text-white"><Search className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Contact (desktop) */}
        <div className="hidden md:block ml-auto shrink-0 text-right border border-[#E91E63] rounded px-3 py-1.5">
          <p className="text-[10px] text-[#E91E63] font-bold">여우알바 고객센터</p>
          <p className="text-[14px] font-bold text-[#E91E63]">010-0000-0000</p>
          <p className="text-[9px] text-[#999]">상담시간 평일 10:00~18:00</p>
        </div>

        {/* 광고등록 배너 (desktop) */}
        <Link href="/post-job/" className="hidden md:block shrink-0 bg-[#1E3A5F] text-white rounded px-4 py-3 text-center">
          <p className="text-[13px] font-bold">광고 등록</p>
          <p className="text-[10px] text-[#C9A961]">이력서 무료등록</p>
        </Link>

        {/* Mobile */}
        <button onClick={() => setOpen(!open)} className="ml-auto md:hidden p-1.5 text-[#666]">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Row 3: Icon menu bar (러브알바 핑크바 → 네이비) */}
      <div className="bg-[#1E3A5F]">
        <div className="mx-auto max-w-[960px] px-3 flex items-center justify-around py-2">
          {ICONS.map(({ href, icon: I, label }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 text-white/90 hover:text-white">
              <I className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-[10px] md:text-[11px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-[#eee] p-3 bg-white">
          <div className="flex border border-[#ddd] rounded mb-3 overflow-hidden">
            <input type="text" placeholder="검색..." className="flex-1 px-3 py-2 text-[13px] outline-none" />
            <button className="px-3 bg-[#1E3A5F] text-white"><Search className="h-4 w-4" /></button>
          </div>
          <nav className="flex flex-col gap-0.5">
            {ICONS.map(m => (
              <Link key={m.href} href={m.href} className="px-3 py-2 text-[13px] text-[#555] hover:bg-[#f5f5f5] rounded" onClick={() => setOpen(false)}>{m.label}</Link>
            ))}
            <Link href="/post-job/" className="btn btn-gold mt-2 py-2 text-center" onClick={() => setOpen(false)}>광고등록</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
