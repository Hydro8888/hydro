'use client';

import { useState } from 'react';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const channels = [
    {
      label: '카카오톡',
      href: `https://story.kakao.com/share?url=${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.726 1.802 5.117 4.51 6.473-.158.564-.574 2.044-.657 2.361-.103.393.144.387.302.282.124-.083 1.978-1.346 2.782-1.893.34.05.69.078 1.063.078 5.523 0 10-3.463 10-7.691S17.523 3 12 3z" />
        </svg>
      ),
    },
    {
      label: '페이스북',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
  ];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {channels.map((ch) => (
        <a
          key={ch.label}
          href={ch.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-badge
            bg-surface-elevated border border-border-muted
            text-caption text-text-secondary
            hover:text-text hover:border-border hover:bg-surface-card
            transition-colors duration-200"
        >
          {ch.icon}
          <span>{ch.label}</span>
        </a>
      ))}

      {/* Copy link button */}
      <button
        type="button"
        onClick={handleCopy}
        className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-badge
          bg-surface-elevated border border-border-muted
          text-caption text-text-secondary
          hover:text-text hover:border-border hover:bg-surface-card
          transition-colors duration-200"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <span>{copied ? '복사됨' : '링크 복사'}</span>

        {/* Toast */}
        {copied && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap
            px-2 py-1 rounded-badge bg-accent text-white text-caption
            animate-toast-in pointer-events-none">
            복사됨
          </span>
        )}
      </button>
    </div>
  );
}
