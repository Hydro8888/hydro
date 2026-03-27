import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { QueryProvider } from '@/providers/QueryProvider';

export const metadata: Metadata = {
  title: '여우알바 - 여성 전문 구인구직 | YeouAlba',
  description: '안전하고 신뢰할 수 있는 여성 전문 구인구직 플랫폼',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, themeColor: '#1E3A5F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <Header />
          <main className="min-h-screen pb-16 md:pb-0">{children}</main>
          <BottomNav />
          <footer className="hidden md:block border-t border-[#ddd] bg-[#f9f9f9] py-4 text-[11px] text-[#888]">
            <div className="mx-auto max-w-[960px] px-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-4">
                <Link href="/support/">회사소개</Link>
                <Link href="/support/">개인정보보호정책</Link>
                <Link href="/support/">이용약관</Link>
                <Link href="/support/">고객센터</Link>
                <Link href="/post-job/">제휴 및 광고문의</Link>
              </div>
              <p>© 2026 여우알바(YeouAlba). All rights reserved.</p>
            </div>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
