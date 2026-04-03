'use client';

import { useRouter } from 'next/navigation';
import { useRef, type FormEvent } from 'react';

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
}

export default function SearchBar({
  defaultValue = '',
  placeholder = '뉴스 검색...',
}: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="w-full">
      <div className="relative flex items-center">
        {/* Search icon */}
        <span className="pointer-events-none absolute left-3 flex items-center text-text-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
        </span>

        <input
          ref={inputRef}
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-pill border border-border bg-surface-elevated py-2 pl-9 pr-20 text-sm text-text outline-none placeholder:text-text-muted
            focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
        />

        <button
          type="submit"
          className="absolute right-1.5 rounded-pill bg-accent px-4 py-1.5 text-xs font-semibold text-surface hover:bg-accent/90 active:bg-accent/80 transition-colors"
        >
          검색
        </button>
      </div>
    </form>
  );
}
