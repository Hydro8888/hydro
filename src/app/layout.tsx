import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Loading from './loading';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0d1117',
};

export const metadata: Metadata = {
  title: {
    default: 'LiveNews - 글로벌 라이브 뉴스',
    template: '%s | LiveNews',
  },
  description: '전 세계 주요 뉴스를 실시간 AI 번역·요약으로 한국어 제공하는 글로벌 뉴스 허브',
  icons: {
    icon: [
      { url: '/livenews/favicon.ico', sizes: '48x48' },
      { url: '/livenews/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/livenews/apple-touch-icon.png',
  },
  openGraph: {
    title: 'LiveNews - 글로벌 라이브 뉴스',
    description: '세계·미국·일본·중국 주요 뉴스를 한 화면에서',
    type: 'website',
    siteName: 'LiveNews',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="bg-surface text-text min-h-screen flex flex-col overflow-x-hidden">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-card focus:bg-accent focus:text-white focus:text-sm focus:font-semibold"
        >
          본문 바로가기
        </a>
        <Header />
        <Suspense fallback={<Loading />}>
          <main id="main" className="flex-1">{children}</main>
        </Suspense>
        <Footer />
      </body>
    </html>
  );
}
