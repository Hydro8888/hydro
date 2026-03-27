'use client';

import Link from 'next/link';
import { Briefcase, Heart, Bell, Shield, Wallet, Settings, LogOut, ChevronRight } from 'lucide-react';

const MENU = [
  { icon: Briefcase, label: '지원 내역', badge: '3' },
  { icon: Heart, label: '저장 공고', badge: '12' },
  { icon: Bell, label: '알림 설정' },
  { icon: Shield, label: '안전 설정' },
  { icon: Wallet, label: '수익 관리' },
  { icon: Settings, label: '프로필 편집' },
];

export default function MyPage() {
  return (
    <div className="mx-auto max-w-[640px] px-4 py-5">
      <h1 className="text-xl font-bold mb-4">마이페이지</h1>
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#1E3A5F] rounded-full flex items-center justify-center text-2xl">🦊</div>
          <div><p className="text-sm text-[#999]">로그인이 필요합니다</p><Link href="/login/" className="text-sm font-bold text-[#E91E63]">로그인 / 회원가입</Link></div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[{ n: 0, l: '지원', c: '#1E3A5F' }, { n: 0, l: '저장', c: '#C9A961' }, { n: 0, l: '알림', c: '#222' }].map(s => (
            <div key={s.l} className="bg-[#f7f8fa] border border-[#e0e0e0] rounded-lg p-3 text-center"><p className="text-lg font-bold" style={{ color: s.c }}>{s.n}</p><p className="text-xs text-[#999]">{s.l}</p></div>
          ))}
        </div>
      </div>
      <div className="card overflow-hidden">
        {MENU.map((m, i) => { const I = m.icon; return (
          <button key={i} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-[#f7f8fa] ${i < MENU.length - 1 ? 'border-b border-[#f0f0f0]' : ''}`}>
            <I className="h-4 w-4 text-[#999]" /><span className="flex-1 text-sm">{m.label}</span>
            {m.badge && <span className="bg-[#E91E63] text-[#ffffff] rounded-full px-2 py-0.5 text-xs font-bold">{m.badge}</span>}
            <ChevronRight className="h-4 w-4 text-[#999]" />
          </button>
        ); })}
      </div>
      <div className="card mt-4 p-4 border-[#2E7D32]">
        <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-[#2E7D32]" /><div><p className="text-sm font-bold text-[#2E7D32]">안전 센터</p><p className="text-xs text-[#999]">위급 시 긴급 연락처 알림</p></div></div>
        <button className="btn mt-3 w-full py-2.5 border border-[#2E7D32] text-[#2E7D32] bg-white hover:bg-[#2E7D32] hover:text-[#ffffff] text-sm font-bold rounded-lg">안전 설정</button>
      </div>
      <button className="mt-4 w-full text-center py-3 text-sm text-[#999] hover:text-[#222] flex items-center justify-center gap-1.5"><LogOut className="h-4 w-4" /> 로그아웃</button>
    </div>
  );
}
