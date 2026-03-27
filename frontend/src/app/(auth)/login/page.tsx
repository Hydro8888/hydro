'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🦊</div>
          <h1 className="text-xl font-bold"><span className="text-[#1E3A5F]">여우</span><span className="text-[#C9A961]">알바</span></h1>
          <p className="text-sm text-[#999] mt-1">여성 전문 구인구직 플랫폼</p>
        </div>
        <form onSubmit={e => e.preventDefault()} className="card p-6">
          <div className="mb-3"><label className="text-xs text-[#999] mb-1.5 block">아이디</label><input type="text" value={u} onChange={e => setU(e.target.value)} placeholder="아이디" className="input" /></div>
          <div className="mb-5"><label className="text-xs text-[#999] mb-1.5 block">비밀번호</label><input type="password" value={p} onChange={e => setP(e.target.value)} placeholder="비밀번호" className="input" /></div>
          <button type="submit" className="btn btn-navy w-full py-3 text-sm">로그인</button>
          <div className="mt-3 flex justify-between text-xs"><Link href="/register/" className="text-[#E91E63] font-medium">회원가입</Link><button type="button" className="text-[#999]">아이디/비번 찾기</button></div>
          <div className="relative my-5"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e0e0e0]" /></div><div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-[#999]">소셜 로그인</span></div></div>
          <div className="flex gap-2">
            <button type="button" className="flex-1 rounded-lg py-2.5 text-sm font-bold bg-[#FEE500] text-black">카카오</button>
            <button type="button" className="flex-1 rounded-lg py-2.5 text-sm font-bold bg-[#03C75A] text-[#ffffff]">네이버</button>
          </div>
        </form>
      </div>
    </div>
  );
}
