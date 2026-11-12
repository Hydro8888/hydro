'use client';

import { useEffect, useRef, useState } from 'react';
import { BTN_SECONDARY_SM } from '@/lib/ui';

interface ShareButtonsProps {
  url: string;
  title: string;
}

type CopyState = 'idle' | 'copied' | 'failed';

/** Legacy fallback; true only when the browser reports the copy actually happened. */
function execCommandCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  try {
    textarea.select();
    return document.execCommand('copy') === true;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  // Named by their label only: no brand marks, no brand colors.
  const channels = [
    { label: '카카오톡', href: `https://story.kakao.com/share?url=${encodedUrl}` },
    { label: '페이스북', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
  ];

  async function handleCopy() {
    let ok = false;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard API unavailable');
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      ok = execCommandCopy(url);
    }
    setCopyState(ok ? 'copied' : 'failed');
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState('idle'), 2000);
  }

  const copyLabel = copyState === 'copied' ? '복사됨' : copyState === 'failed' ? '복사 실패' : '링크 복사';
  const statusText = copyState === 'copied' ? '링크를 복사했습니다' : copyState === 'failed' ? '링크를 복사하지 못했습니다' : '';

  return (
    <div role="group" aria-label="기사 공유" className="flex flex-wrap items-center gap-2">
      <span aria-hidden="true" className="text-caption text-text-muted">
        공유
      </span>
      {channels.map((ch) => (
        <a
          key={ch.label}
          href={ch.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${ch.label}에 공유 (새 창)`}
          className={BTN_SECONDARY_SM}
        >
          {ch.label}
        </a>
      ))}

      {/* min-w-24 keeps the row still while the label changes. */}
      <button type="button" onClick={handleCopy} className={`${BTN_SECONDARY_SM} min-w-24`}>
        {copyLabel}
      </button>
      {/* Announces the copy result to assistive tech (the button label changes visually). */}
      <span role="status" aria-live="polite" className="sr-only">
        {statusText}
      </span>
    </div>
  );
}
