'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4a7dff] to-[#7c5cfc] text-lg font-bold text-white">Y</div>
          <h1 className="text-2xl font-bold">
            <span className="text-[#4a7dff]">여우</span>
            <span className="text-[#f0c040]">알바</span>
          </h1>
          <p className="mt-1 text-sm text-[#7a8ba8]">안전하고 스마트한 여우알바</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); }} className="glass p-5">
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-[#7a8ba8]">아이디</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="아이디" className="w-full rounded-lg border border-[#1e3050] bg-[#111d35] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-[#4a5d7a] focus:border-[#4a7dff]" />
          </div>
          <div className="mb-5">
            <label className="mb-1 block text-xs font-medium text-[#7a8ba8]">비밀번호</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" className="w-full rounded-lg border border-[#1e3050] bg-[#111d35] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-[#4a5d7a] focus:border-[#4a7dff]" />
          </div>
          <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-[#4a7dff] to-[#7c5cfc] py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
            로그인
          </button>
          <div className="mt-3 flex items-center justify-between text-xs">
            <Link href="/register/" className="text-[#4a7dff] hover:text-[#6b9aff]">회원가입</Link>
            <button type="button" className="text-[#4a5d7a] hover:text-white">아이디/비번 찾기</button>
          </div>
          <div className="relative my-5"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#1e3050]" /></div><div className="relative flex justify-center text-[10px]"><span className="bg-[#0e1a30] px-3 text-[#4a5d7a]">소셜 로그인</span></div></div>
          <div className="flex gap-2">
            <button type="button" className="flex flex-1 items-center justify-center rounded-xl bg-[#FEE500] py-2.5 text-sm font-medium text-black">카카오</button>
            <button type="button" className="flex flex-1 items-center justify-center rounded-xl bg-[#03C75A] py-2.5 text-sm font-medium text-white">네이버</button>
          </div>
        </form>
      </div>
    </div>
  );
}
