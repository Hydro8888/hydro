'use client';

import { useRouter } from 'next/navigation';
import { useRef, type FormEvent } from 'react';
import { cn } from '@/lib/utils';
import { BTN_PRIMARY, FIELD } from '@/lib/ui';
import { SearchIcon } from './icons';

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
}

export default function SearchBar({
  defaultValue = '',
  placeholder = '뉴스 검색',
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  // Input + button side by side (same shape as the footer subscribe form): two 40px controls, 8px apart.
  return (
    <form onSubmit={handleSubmit} role="search" className="flex w-full gap-2">
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted">
          <SearchIcon />
        </span>
        {/* pl-10 = 12px inset + 16px icon + 12px gap */}
        <input
          ref={inputRef}
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label="뉴스 검색"
          autoComplete="off"
          className={cn(FIELD, 'pl-10')}
        />
      </div>
      <button type="submit" className={cn(BTN_PRIMARY, 'shrink-0')}>
        검색
      </button>
    </form>
  );
}
