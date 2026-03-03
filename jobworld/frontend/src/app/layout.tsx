import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI JobWorld - AI 맞춤 구인구직',
  description: 'AI가 찾아주는 나만의 맞춤 일자리. 구인·구직 등록부터 검색까지 누구나 완전 무료! AI JobWorld',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  )
}
