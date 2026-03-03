import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JobWorld - AI 기반 구인구직',
  description: 'AI가 당신에게 딱 맞는 일자리를 찾아드립니다. 무료 구인구직 플랫폼 JobWorld',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  )
}
