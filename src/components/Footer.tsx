import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-100 border-t border-gray-200 mt-12">
      <div className="mx-auto max-w-screen-xl px-4 py-8">
        {/* Logo + tagline */}
        <div className="mb-5 flex items-center gap-1">
          <span className="text-lg font-extrabold text-blue-600">Live</span>
          <span className="text-lg font-extrabold text-gray-800">News</span>
          <span className="ml-2 text-sm text-gray-500">— 세계 뉴스를 한국어로</span>
        </div>

        {/* Links */}
        <nav className="mb-6">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
            <li>
              <Link href="/about" className="hover:text-blue-600 transition-colors">
                회사소개
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-blue-600 transition-colors">
                문의하기
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-blue-600 transition-colors">
                이용약관
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                개인정보처리방침
              </Link>
            </li>
            <li>
              <Link href="/advertise" className="hover:text-blue-600 transition-colors">
                광고문의
              </Link>
            </li>
          </ul>
        </nav>

        {/* Disclaimer */}
        <p className="mb-3 text-xs leading-relaxed text-gray-500 max-w-2xl">
          본 서비스는 세계 각국의 뉴스를 AI를 통해 번역·요약하여 제공합니다.
          원문 저작권은 각 언론사에 있으며, 번역·요약 과정에서 오류가 있을 수 있습니다.
          중요한 정보는 원문을 직접 확인하시기 바랍니다.
        </p>

        {/* Copyright */}
        <p className="text-xs text-gray-400">
          &copy; {year} LiveNews. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
