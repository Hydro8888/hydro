'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call
    console.log('Login:', { username, password });
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-primary">여우</span>
            <span className="text-accent">알바</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">안전하고 스마트한 여우알바</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium">아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              required
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-primary py-3 font-semibold text-white transition-all hover:bg-primary-light"
          >
            로그인
          </button>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link href="/register" className="text-primary hover:text-primary-light">
              회원가입
            </Link>
            <button type="button" className="text-muted-foreground hover:text-foreground">
              아이디/비밀번호 찾기
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">소셜 로그인</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#FEE500] py-3 text-sm font-medium text-[#000000]"
            >
              카카오 로그인
            </button>
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#03C75A] py-3 text-sm font-medium text-white"
            >
              네이버 로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
