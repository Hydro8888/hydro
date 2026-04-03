import Header from '@/components/Header'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f2f0eb]">
      <Header />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-[#1c1c1c] tracking-tight mb-4">JobWorld 소개</h1>
        <p className="text-[#6b6b6b] leading-relaxed mb-8">
          JobWorld는 AI 기술을 활용하여 구직자와 기업을 효율적으로 연결하는 <strong className="text-[#1c1c1c]">완전 무료</strong> 구인구직 플랫폼입니다.
        </p>

        <div className="bg-white border border-[#ddd9d0] rounded-2xl p-6 mb-4">
          <h2 className="text-base font-bold text-[#1c1c1c] mb-4">핵심 특징</h2>
          <ul className="space-y-3">
            {[
              '자연어 AI 검색 — "판교 주 3일 개발자" 같은 자연어로 검색',
              '무료 채용공고 및 이력서 등록',
              '플랫폼 등록 데이터 우선 검색',
              '원클릭 입사 지원',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-[#6b6b6b]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8623a] mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#e8623a] hover:underline mt-4">
          ← 홈으로
        </Link>
      </div>
    </div>
  )
}
