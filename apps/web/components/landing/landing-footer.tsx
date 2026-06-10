'use client';

import { useState } from 'react';
import Link from 'next/link';

const footerLinks = {
  제품: [
    { label: '기능', href: '#features' },
    { label: '모델', href: '#models' },
    { label: '요금제', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  회사: [
    { label: '소개', href: 'mailto:contact@free.ai.kr?subject=소개 문의' },
    { label: '채용', href: 'mailto:contact@free.ai.kr?subject=채용 문의' },
    { label: '파트너십', href: 'mailto:contact@free.ai.kr?subject=파트너십 문의' },
    { label: '광고 문의', href: 'mailto:contact@free.ai.kr?subject=광고 문의' },
  ],
  리소스: [
    { label: '대시보드', href: '/chat' },
    { label: '히스토리', href: '/history' },
    { label: '설정', href: '/settings' },
    { label: '요금제 관리', href: '/billing' },
  ],
  법적: [
    { label: '이용약관', href: 'mailto:contact@free.ai.kr?subject=이용약관 문의' },
    { label: '개인정보처리방침', href: 'mailto:contact@free.ai.kr?subject=개인정보 문의' },
    { label: '쿠키 정책', href: 'mailto:contact@free.ai.kr?subject=쿠키 정책 문의' },
    { label: '환불 정책', href: 'mailto:contact@free.ai.kr?subject=환불 문의' },
  ],
};

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    try {
      localStorage.setItem('newsletter-email', email);
    } catch (err) {
      console.warn('[newsletter] localStorage failed:', err);
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="text-xs text-success-600 dark:text-success-500">
        ✓ 구독 완료! 곧 AI 트렌드 소식을 전해드릴게요.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-xs">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        required
        pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
        aria-label="뉴스레터 구독 이메일"
        className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
      />
      <button
        type="submit"
        className="px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
      >
        구독
      </button>
    </form>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center shadow-xs">
                <span className="text-white dark:text-gray-900 font-bold text-xs">AI</span>
              </div>
              <span className="font-semibold text-base text-gray-900 dark:text-white">AI Portal Pro</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mb-6">
              전세계 TOP 10 프리미엄 AI를 하나의 대시보드에서.
              팀의 생산성을 다음 단계로 끌어올리세요.
            </p>

            {/* Newsletter */}
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">뉴스레터</p>
              <NewsletterForm />
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('mailto:') || link.href.startsWith('#') ? (
                      <a
                        href={link.href}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 rounded-sm"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 rounded-sm"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} AI Portal Pro. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            Made with AI · Powered by 10 premium models
          </p>
        </div>
      </div>
    </footer>
  );
}
