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
    <div className="mx-auto max-w-[500px] px-3 py-4">
      <h1 className="text-[18px] font-bold mb-3">마이페이지</h1>
      <div className="card p-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-[50px] h-[50px] bg-[#1E3A5F] rounded-full flex items-center justify-center text-xl">🦊</div>
          <div><p className="text-[13px] text-[#888]">로그인이 필요합니다</p><Link href="/login/" className="text-[12px] font-bold text-[#E91E63]">로그인 / 회원가입</Link></div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[{ n: 0, l: '지원' }, { n: 0, l: '저장' }, { n: 0, l: '알림' }].map(s => (
            <div key={s.l} className="bg-[#f9f9f9] border border-[#eee] rounded p-2 text-center"><p className="text-[16px] font-bold text-[#1E3A5F]">{s.n}</p><p className="text-[10px] text-[#999]">{s.l}</p></div>
          ))}
        </div>
      </div>
      <div className="card overflow-hidden">
        {MENU.map((m, i) => { const I = m.icon; return (
          <button key={i} className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f9f9f9] ${i < MENU.length - 1 ? 'border-b border-[#eee]' : ''}`}>
            <I className="h-4 w-4 text-[#999]" /><span className="flex-1 text-[13px]">{m.label}</span>
            {m.badge && <span className="bg-[#E91E63] text-[#fff] rounded-full px-1.5 py-0.5 text-[10px]">{m.badge}</span>}
            <ChevronRight className="h-4 w-4 text-[#ccc]" />
          </button>
        ); })}
      </div>
      <div className="card mt-3 p-3 border-[#D4EDDA]">
        <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-[#28a745]" /><div><p className="text-[13px] font-bold text-[#28a745]">안전 센터</p><p className="text-[10px] text-[#888]">위급 시 긴급 연락처 알림</p></div></div>
        <button className="btn mt-2 w-full py-2 border border-[#28a745] text-[#28a745] bg-white hover:bg-[#28a745] hover:text-white text-[12px]">안전 설정</button>
      </div>
      <button className="mt-3 w-full text-center py-2 text-[12px] text-[#999] hover:text-[#333] flex items-center justify-center gap-1"><LogOut className="h-3.5 w-3.5" /> 로그아웃</button>
    </div>
  );
}
