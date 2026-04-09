import Link from 'next/link';

const footerLinks = {
  제품: [
    { label: '기능', href: '#features' },
    { label: '모델', href: '#models' },
    { label: '요금제', href: '#pricing' },
    { label: 'API 문서', href: '#' },
  ],
  회사: [
    { label: '소개', href: '#' },
    { label: '블로그', href: '#' },
    { label: '채용', href: '#' },
    { label: '광고 문의', href: 'mailto:contact@free.ai.kr' },
  ],
  법적: [
    { label: '이용약관', href: '#' },
    { label: '개인정보처리방침', href: '#' },
    { label: '쿠키 정책', href: '#' },
  ],
};

export function LandingFooter() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">AI</span>
              </div>
              <span className="font-bold text-sm">AI Portal Pro</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              전세계 TOP 10 프리미엄 AI를
              <br />
              하나의 대시보드에서 만나보세요.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('mailto:') || link.href === '#' ? (
                      <a href={link.href} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-400 text-center">
          &copy; {new Date().getFullYear()} AI Portal Pro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
