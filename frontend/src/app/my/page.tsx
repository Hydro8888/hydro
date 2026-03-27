'use client';

import Link from 'next/link';
import { Briefcase, Heart, Bell, Shield, Wallet, Settings, LogOut, ChevronRight } from 'lucide-react';

const MENU = [
  { icon: Briefcase, label: '지원 내역', badge: '3' },
  { icon: Heart, label: '저장 공고', badge: '12' },
  { icon: Bell, label: '알림 설정' },
  { icon: Shield, label: 'SOS 안전 설정' },
  { icon: Wallet, label: '수익 관리' },
  { icon: Settings, label: '프로필 편집' },
];

export default function MyPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <h1 className="mb-4 text-xl font-bold">마이페이지</h1>
      <div className="card mb-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e85d8a]/20 to-[#c44dbb]/20 text-2xl">🦊</div>
          <div><p className="text-[#9a8aa8]">로그인이 필요합니다</p><Link href="/login/" className="text-sm font-medium text-[#e85d8a]">로그인 / 회원가입</Link></div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[{ n: 0, l: '지원', c: '#e85d8a' }, { n: 0, l: '저장', c: '#d4a76a' }, { n: 0, l: '알림', c: '#f0e8f0' }].map(s => (
            <div key={s.l} className="rounded-xl bg-[#1e142a] p-3 text-center">
              <p className="text-lg font-bold" style={{ color: s.c }}>{s.n}</p>
              <p className="text-[10px] text-[#6a5a7a]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="card overflow-hidden">
        {MENU.map((m, i) => {
          const I = m.icon;
          return (
            <button key={i} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[#1e142a]/50 ${i < MENU.length - 1 ? 'border-b border-[#2a1e3a]/50' : ''}`}>
              <I className="h-[18px] w-[18px] text-[#6a5a7a]" /><span className="flex-1 text-sm">{m.label}</span>
              {m.badge && <span className="rounded-full bg-[#e85d8a] px-2 py-0.5 text-[10px] text-white">{m.badge}</span>}
              <ChevronRight className="h-4 w-4 text-[#6a5a7a]" />
            </button>
          );
        })}
      </div>
      <div className="card mt-4 border-[#ff6b6b]/20 p-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-[#ff6b6b]" />
          <div><h3 className="text-sm font-semibold text-[#ff6b6b]">긴급 SOS</h3><p className="text-[10px] text-[#6a5a7a]">위급 시 긴급 연락처에 알림</p></div>
        </div>
        <button className="mt-3 w-full rounded-xl border border-[#ff6b6b]/30 bg-[#ff6b6b]/10 py-2.5 text-sm font-medium text-[#ff6b6b] transition hover:bg-[#ff6b6b] hover:text-white">SOS 설정</button>
      </div>
      <button className="mt-4 flex w-full items-center justify-center gap-1.5 py-3 text-sm text-[#6a5a7a] hover:text-white"><LogOut className="h-4 w-4" /> 로그아웃</button>
    </div>
  );
}
