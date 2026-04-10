import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import SessionWrapper from '@/components/layout/SessionWrapper';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Simburum - AI 기반 생활대행 매칭 플랫폼',
  description:
    '청소, 배달, 장보기, 수리부터 각종 심부름까지. AI가 요청을 분석하고 가장 적합한 헬퍼를 매칭해드립니다. 플랫폼 수수료 0원.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
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
