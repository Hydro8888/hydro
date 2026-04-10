import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import SessionWrapper from '@/components/layout/SessionWrapper';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Simburum | AI 기반 생활대행 매칭 플랫폼 - 수수료 0원',
  description:
    '귀찮은 일은 맡기세요. AI가 검증된 헬퍼를 매칭해 드립니다. 배달, 구매대행, 줄서기, 방문대행, 거래대행까지. 플랫폼 수수료 0원.',
  keywords: '심부름, 생활대행, AI매칭, 구매대행, 배달대행, 줄서기대행, 거래대행',
  openGraph: {
    title: 'Simburum - AI가 연결하는 생활대행 플랫폼',
    description: '검증된 헬퍼가 빠르고 안전하게 처리해 드립니다. 수수료 0원.',
    type: 'website',
    locale: 'ko_KR',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#4F46E5" />
      </head>
      <body className="flex flex-col min-h-screen">
        <SessionWrapper>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionWrapper>
      </body>
    </html>
  );
}
