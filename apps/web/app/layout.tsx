import type { Metadata } from 'next';
import { QueryProvider } from '@/components/query-provider';
import { AuthProvider } from '@/components/auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'AI Portal Pro - 하나의 대시보드, 모든 프리미엄 AI',
    template: '%s | AI Portal Pro',
  },
  description:
    'GPT-5.4, Claude Opus 4.6, Gemini 3.1 Pro, Grok 등 전세계 TOP 10 프리미엄 AI를 하나의 대시보드에서 비교하고 사용하세요. 무료로 시작하세요.',
  keywords: ['AI', 'ChatGPT', 'Claude', 'Gemini', 'Grok', 'LLM', 'AI 비교', 'AI 포털', 'AI 채팅', '인공지능'],
  authors: [{ name: 'AI Portal Pro' }],
  creator: 'AI Portal Pro',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: 'AI Portal Pro',
    title: 'AI Portal Pro - 하나의 대시보드, 모든 프리미엄 AI',
    description:
      'GPT-5.4, Claude Opus 4.6, Gemini 3.1 Pro, Grok 등 전세계 TOP 10 프리미엄 AI를 하나의 대시보드에서 비교하고 사용하세요.',
    images: [
      {
        url: '/freeai/icon-512.png',
        width: 512,
        height: 512,
        alt: 'AI Portal Pro',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Portal Pro - 하나의 대시보드, 모든 프리미엄 AI',
    description:
      'GPT-5.4, Claude Opus 4.6, Gemini 3.1 Pro, Grok 등 전세계 TOP 10 프리미엄 AI를 하나의 대시보드에서 비교하고 사용하세요.',
    images: ['/freeai/icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/freeai/favicon.ico', sizes: 'any' },
      { url: '/freeai/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/freeai/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <html lang="ko" suppressHydrationWarning>
        <body className="font-sans antialiased">
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
