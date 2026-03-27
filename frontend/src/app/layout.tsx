import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { QueryProvider } from '@/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'YeouAlba - 여우알바 | 여성 전문 구인구직',
  description: '안전하고 신뢰할 수 있는 여성 전문 구인구직 플랫폼, 여우알바',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, themeColor: '#0D1B2A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <Header />
          <main className="min-h-screen pt-[85px] md:pt-[95px] pb-20 md:pb-6">{children}</main>
          <BottomNav />
          {/* Footer (desktop) */}
          <footer className="hidden md:block border-t border-[#1E3A5F]/20 bg-[#0A1420] py-6">
            <div className="mx-auto max-w-6xl px-4">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748B]">
                <div className="flex items-center gap-4">
                  <Link href="/support/" className="hover:text-[#94A3B8]">회사소개</Link>
                  <Link href="/support/" className="hover:text-[#94A3B8]">개인정보보호정책</Link>
                  <Link href="/support/" className="hover:text-[#94A3B8]">이용약관</Link>
                  <Link href="/support/" className="hover:text-[#94A3B8]">고객센터</Link>
                  <Link href="/post-job/" className="hover:text-[#94A3B8]">제휴 및 광고문의</Link>
                </div>
                <p>© 2026 여우알바(YeouAlba). All rights reserved.</p>
              </div>
            </div>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
