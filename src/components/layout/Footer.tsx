import React from 'react';
import Link from 'next/link';

const SERVICE_LINKS = [
  { label: '생활대행', href: '/services' },
  { label: '구매대행', href: '/services' },
  { label: '방문대행', href: '/services' },
  { label: '거래대행', href: '/services' },
];

const SUPPORT_LINKS = [
  { label: 'FAQ', href: '/support' },
  { label: '이용약관', href: '/support' },
  { label: '개인정보처리방침', href: '/support' },
  { label: '문의하기', href: '/support' },
];

const INFO_LINKS = [
  { label: '헬퍼 지원', href: '/helper-apply' },
  { label: '요금 안내', href: '/pricing' },
  { label: '안전·신뢰', href: '/safety' },
];

export default function Footer() {
  return (
    <footer className="bg-warm-100 border-t border-warm-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top: Logo + columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-1.5 mb-3">
              <span className="text-lg font-bold text-teal-600">Simburum</span>
              <span className="text-xs text-warm-400">심부름</span>
            </Link>
            <p className="text-sm text-warm-500 leading-relaxed">
              AI 기반 생활대행 매칭 플랫폼.
              <br />수수료 0원으로 안전하게.
            </p>
          </div>

          {/* 서비스 안내 */}
          <div>
            <h3 className="text-sm font-bold text-warm-700 mb-3">서비스 안내</h3>
            <ul className="space-y-2">
              {SERVICE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-warm-500 hover:text-teal-600 transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 고객지원 */}
          <div>
            <h3 className="text-sm font-bold text-warm-700 mb-3">고객지원</h3>
            <ul className="space-y-2">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-warm-500 hover:text-teal-600 transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 안내 */}
          <div>
            <h3 className="text-sm font-bold text-warm-700 mb-3">안내</h3>
            <ul className="space-y-2">
              {INFO_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-warm-500 hover:text-teal-600 transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-warm-400">&copy; {new Date().getFullYear()} Simburum. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-teal-600 font-semibold bg-teal-50 px-2.5 py-1 rounded-full">플랫폼 이용료 무료</span>
            <span className="text-xs text-warm-400">help@simburum.com</span>
            <span className="text-xs text-warm-400">1588-0000</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
