import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { QueryProvider } from '@/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'YeouAlba - 여우알바 | 안전한 여성 고소득 알바',
  description: '안전하고 스마트한 여우알바, 오늘 바로 시작하세요.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#120b18',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <Header />
          <main className="min-h-screen pt-14 pb-20 md:pb-6">{children}</main>
          <BottomNav />
        </QueryProvider>
      </body>
    </html>
  );
}
