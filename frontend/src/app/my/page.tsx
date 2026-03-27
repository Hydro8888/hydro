'use client';

import Link from 'next/link';
import { Briefcase, Heart, Bell, Shield, Wallet, Settings, LogOut, ChevronRight, User } from 'lucide-react';

const MENU_ITEMS = [
  { href: '/my/applications', icon: Briefcase, label: '지원 내역', badge: '3' },
  { href: '/my/saved', icon: Heart, label: '저장 공고', badge: '12' },
  { href: '/my/notifications', icon: Bell, label: '알림 설정', badge: '' },
  { href: '/my/sos', icon: Shield, label: 'SOS 안전 설정', badge: '' },
  { href: '/my/earnings', icon: Wallet, label: '수익 관리', badge: '' },
  { href: '/my/settings', icon: Settings, label: '프로필 편집', badge: '' },
];

export default function MyPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">마이페이지</h1>

      {/* Profile card */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-3xl">
            🦊
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground">로그인이 필요합니다</p>
            <Link
              href="/login"
              className="mt-1 inline-block text-sm font-medium text-primary hover:text-primary-light"
            >
              로그인 / 회원가입
            </Link>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-lg font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground">지원</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-lg font-bold text-accent">0</p>
            <p className="text-xs text-muted-foreground">저장</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-lg font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">알림</p>
          </div>
        </div>
      </div>

      {/* Menu list */}
      <div className="rounded-2xl border border-border bg-card">
        {MENU_ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30 ${
                i !== MENU_ITEMS.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm">{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">{item.badge}</span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          );
        })}
      </div>

      {/* SOS section */}
      <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive">긴급 SOS</h3>
            <p className="text-xs text-muted-foreground">위급 상황 시 긴급 연락처에 알림을 보냅니다</p>
          </div>
        </div>
        <button className="mt-3 w-full rounded-full border border-destructive bg-destructive/10 py-2.5 text-sm font-medium text-destructive transition-all hover:bg-destructive hover:text-white">
          SOS 설정하기
        </button>
      </div>

      {/* Logout */}
      <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm text-muted-foreground hover:text-foreground">
        <LogOut className="h-4 w-4" />
        로그아웃
      </button>
    </div>
  );
}
