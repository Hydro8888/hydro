'use client';

import Link from 'next/link';
import { Briefcase, Heart, Bell, Shield, Wallet, Settings, LogOut, ChevronRight } from 'lucide-react';

const MENU = [
  { href: '/my/', icon: Briefcase, label: '지원 내역', badge: '3' },
  { href: '/my/', icon: Heart, label: '저장 공고', badge: '12' },
  { href: '/my/', icon: Bell, label: '알림 설정', badge: '' },
  { href: '/my/', icon: Shield, label: 'SOS 안전 설정', badge: '' },
  { href: '/my/', icon: Wallet, label: '수익 관리', badge: '' },
  { href: '/my/', icon: Settings, label: '프로필 편집', badge: '' },
];

export default function MyPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <h1 className="mb-4 text-xl font-bold">마이페이지</h1>

      <div className="glass mb-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4a7dff]/20 to-[#7c5cfc]/20 text-2xl">🦊</div>
          <div>
            <p className="text-[#7a8ba8]">로그인이 필요합니다</p>
            <Link href="/login/" className="mt-0.5 inline-block text-sm font-medium text-[#4a7dff] hover:text-[#6b9aff]">로그인 / 회원가입</Link>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[{ n: 0, l: '지원', c: '#4a7dff' }, { n: 0, l: '저장', c: '#f0c040' }, { n: 0, l: '알림', c: '#dce4f0' }].map((s) => (
            <div key={s.l} className="rounded-xl bg-[#111d35] p-3 text-center">
              <p className="text-lg font-bold" style={{ color: s.c }}>{s.n}</p>
              <p className="text-[10px] text-[#4a5d7a]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass overflow-hidden">
        {MENU.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link key={i} href={item.href} className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#1a2a4a]/40 ${i < MENU.length - 1 ? 'border-b border-[#1e3050]/50' : ''}`}>
              <Icon className="h-[18px] w-[18px] text-[#4a5d7a]" />
              <span className="flex-1 text-sm">{item.label}</span>
              {item.badge && <span className="rounded-full bg-[#4a7dff] px-2 py-0.5 text-[10px] text-white">{item.badge}</span>}
              <ChevronRight className="h-4 w-4 text-[#4a5d7a]" />
            </Link>
          );
        })}
      </div>

      <div className="glass mt-4 border-red-500/20 p-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-red-400" />
          <div>
            <h3 className="text-sm font-semibold text-red-400">긴급 SOS</h3>
            <p className="text-[11px] text-[#4a5d7a]">위급 시 긴급 연락처에 알림</p>
          </div>
        </div>
        <button className="mt-3 w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500 hover:text-white">
          SOS 설정하기
        </button>
      </div>

      <button className="mt-4 flex w-full items-center justify-center gap-2 py-3 text-sm text-[#4a5d7a] hover:text-white">
        <LogOut className="h-4 w-4" /> 로그아웃
      </button>
    </div>
  );
}
