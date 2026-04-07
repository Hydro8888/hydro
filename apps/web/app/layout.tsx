import type { Metadata } from 'next';
import { QueryProvider } from '@/components/query-provider';
import { AuthProvider } from '@/components/auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Portal Pro - One Dashboard, All Premium AI',
  description:
    '전세계 TOP 10 유료 LLM을 단일 인터페이스에서 선택, 비교, 사용하세요.',
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
