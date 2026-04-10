import React from 'react';
import Link from 'next/link';

const FOOTER_LINKS = {
  서비스: [
    { label: '서비스 소개', href: '/simburum/services' },
    { label: '우수 사례', href: '/simburum/cases' },
    { label: '요금 안내', href: '/simburum/pricing' },
    { label: '헬퍼 지원하기', href: '/simburum/helper-apply' },
  ],
  고객지원: [
    { label: '자주 묻는 질문', href: '/simburum/support/faq' },
    { label: '공지사항', href: '/simburum/support/notices' },
    { label: '문의하기', href: '/simburum/support/contact' },
    { label: '신고·분쟁', href: '/simburum/support/report' },
  ],
  정책: [
    { label: '이용약관', href: '/simburum/terms' },
    { label: '개인정보처리방침', href: '/simburum/privacy' },
    { label: '안전·신뢰 정책', href: '/simburum/trust' },
    { label: '환불 정책', href: '/simburum/refund-policy' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand & Description */}
          <div className="lg:col-span-2">
            <Link href="/simburum" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-white">심부름</span>
            </Link>
            <p className="text-sm text-gray-400 mb-4 max-w-sm">
              AI 기반 생활대행·심부름 매칭 플랫폼. 귀찮은 일은 맡기고,
              능력 있는 헬퍼와 안전하게 연결됩니다.
            </p>

            {/* Zero Fee Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-700/50 rounded-full">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-semibold text-green-400">
                플랫폼 수수료 0원
              </span>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white mb-4">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div className="py-6 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>support@simburum.kr</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>1588-0000</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>평일 09:00 ~ 18:00 (공휴일 제외)</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="py-4 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} 심부름(Simburum). All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            사업자등록번호: 000-00-00000 | 대표: 홍길동
          </p>
        </div>
      </div>
    </footer>
  );
}
