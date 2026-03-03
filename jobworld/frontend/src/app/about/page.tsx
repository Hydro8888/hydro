import Header from '@/components/Header'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-xl mx-auto px-4 py-12 text-sm text-gray-600 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">JobWorld 소개</h1>
        <p>JobWorld는 AI 기술을 활용하여 구직자와 기업을 효율적으로 연결하는 <strong>완전 무료</strong> 구인구직 플랫폼입니다.</p>
        <div>
          <h2 className="font-semibold text-gray-800 mb-2">핵심 특징</h2>
          <ul className="space-y-1 list-disc list-inside">
            <li>자연어 AI 검색 - "판교 주 3일 개발자" 같은 자연어로 검색</li>
            <li>무료 채용공고 등록 및 이력서 등록</li>
            <li>플랫폼 등록 데이터 우선 검색</li>
            <li>원클릭 입사 지원</li>
          </ul>
        </div>
        <Link href="/" className="block text-blue-600 hover:underline">← 홈으로</Link>
      </div>
    </div>
  )
}
