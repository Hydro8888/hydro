'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const inp = "w-full rounded-xl border border-[#1E3A5F]/30 bg-[#112240] px-4 py-2.5 text-sm outline-none placeholder:text-[#64748B] focus:border-[#1E3A5F]";

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-3xl mb-2">🦊</div>
          <h1 className="text-2xl font-bold"><span className="text-[#F8FAFC]">여우</span><span className="text-[#C9A961]">알바</span></h1>
          <p className="mt-1 text-sm text-[#94A3B8]">여성 전문 구인구직 플랫폼</p>
        </div>
        <form onSubmit={e => e.preventDefault()} className="card p-5">
          <div className="mb-3"><label className="mb-1 block text-xs text-[#94A3B8]">아이디</label><input type="text" value={u} onChange={e => setU(e.target.value)} placeholder="아이디" className={inp} /></div>
          <div className="mb-5"><label className="mb-1 block text-xs text-[#94A3B8]">비밀번호</label><input type="password" value={p} onChange={e => setP(e.target.value)} placeholder="비밀번호" className={inp} /></div>
          <button type="submit" className="btn btn-navy w-full py-2.5 text-sm">로그인</button>
          <div className="mt-3 flex justify-between text-xs"><Link href="/register/" className="text-[#C9A961]">회원가입</Link><button type="button" className="text-[#64748B]">아이디/비번 찾기</button></div>
          <div className="relative my-5"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#1E3A5F]/20" /></div><div className="relative flex justify-center"><span className="bg-[#112240] px-3 text-[10px] text-[#64748B]">소셜 로그인</span></div></div>
          <div className="flex gap-2">
            <button type="button" className="flex-1 rounded-xl bg-[#FEE500] py-2.5 text-sm font-medium text-black">카카오</button>
            <button type="button" className="flex-1 rounded-xl bg-[#03C75A] py-2.5 text-sm font-medium text-white">네이버</button>
          </div>
        </form>
      </div>
    </div>
  );
}
