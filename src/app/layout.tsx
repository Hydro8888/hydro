import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'LiveNews - 글로벌 라이브 뉴스',
  description: '전 세계 주요 뉴스를 실시간으로 한국어 요약과 함께 제공하는 글로벌 뉴스 허브',
  openGraph: {
    title: 'LiveNews - 글로벌 라이브 뉴스',
    description: '세계·미국·일본·중국 주요 뉴스를 한 화면에서',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col overflow-x-hidden">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
