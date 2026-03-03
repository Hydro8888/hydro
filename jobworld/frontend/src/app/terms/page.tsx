import Header from '@/components/Header'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-xl mx-auto px-4 py-12 text-sm text-gray-600 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">이용약관</h1>
        <h2 className="font-semibold text-gray-800">제1조 (목적)</h2>
        <p>이 약관은 JobWorld가 제공하는 구인구직 서비스의 이용에 관한 기본적인 사항을 규정합니다.</p>
        <h2 className="font-semibold text-gray-800">제2조 (서비스 이용)</h2>
        <p>JobWorld의 모든 서비스는 무료로 제공됩니다. 허위 정보 등록, 스팸, 불법 정보 게시는 금지됩니다.</p>
        <h2 className="font-semibold text-gray-800">제3조 (책임 제한)</h2>
        <p>JobWorld는 구인구직 정보를 중개하는 플랫폼으로, 채용 결과에 대한 직접적인 책임을 지지 않습니다.</p>
        <h2 className="font-semibold text-gray-800">제4조 (문의)</h2>
        <p>info@jobworld.co.kr</p>
        <Link href="/" className="block text-blue-600 hover:underline">← 홈으로</Link>
      </div>
    </div>
  )
}
