import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { QueryProvider } from '@/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'YeouAlba - 여우알바 | 안전한 여성 고소득 알바',
  description: '안전하고 스마트한 여우알바, 오늘 바로 시작하세요. 전국 유흥알바 정보를 한눈에.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a1628',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen">
        <QueryProvider>
          <Header />
          <main className="pb-safe min-h-screen pt-16">
            {children}
          </main>
          <BottomNav />
        </QueryProvider>
      </body>
    </html>
  );
}
