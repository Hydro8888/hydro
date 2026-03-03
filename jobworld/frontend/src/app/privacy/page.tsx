import Header from '@/components/Header'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-xl mx-auto px-4 py-12 text-sm text-gray-600 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">개인정보처리방침</h1>
        <p>JobWorld(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」을 준수합니다.</p>
        <h2 className="font-semibold text-gray-800">수집하는 개인정보</h2>
        <p>이메일, 이름, 연락처, 이력서 정보 (구직자), 사업자 정보 (기업)</p>
        <h2 className="font-semibold text-gray-800">이용 목적</h2>
        <p>구인구직 서비스 제공, AI 매칭, 서비스 개선</p>
        <h2 className="font-semibold text-gray-800">보유 기간</h2>
        <p>회원 탈퇴 시까지 (관계 법령에 따라 일부 보유 가능)</p>
        <h2 className="font-semibold text-gray-800">문의</h2>
        <p>privacy@jobworld.co.kr</p>
        <Link href="/" className="block text-blue-600 hover:underline">← 홈으로</Link>
      </div>
    </div>
  )
}
