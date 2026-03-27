import type { Metadata, Viewport } from 'next';
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
          <main className="min-h-screen pt-14 pb-20 md:pb-6">{children}</main>
          <BottomNav />
        </QueryProvider>
      </body>
    </html>
  );
}
