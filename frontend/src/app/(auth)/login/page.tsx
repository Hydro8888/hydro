'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const inp = "w-full border border-[#ddd] rounded px-3 py-2.5 text-[13px] outline-none focus:border-[#1E3A5F]";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-3">
      <div className="w-full max-w-[360px]">
        <div className="text-center mb-5">
          <div className="text-3xl mb-1">🦊</div>
          <h1 className="text-[22px] font-bold"><span className="text-[#1E3A5F]">여우</span><span className="text-[#C9A961]">알바</span></h1>
          <p className="text-[12px] text-[#888] mt-0.5">여성 전문 구인구직 플랫폼</p>
        </div>
        <form onSubmit={e => e.preventDefault()} className="card p-5">
          <div className="mb-2.5"><label className="text-[11px] text-[#888] mb-1 block">아이디</label><input type="text" value={u} onChange={e => setU(e.target.value)} placeholder="아이디" className={inp} /></div>
          <div className="mb-4"><label className="text-[11px] text-[#888] mb-1 block">비밀번호</label><input type="password" value={p} onChange={e => setP(e.target.value)} placeholder="비밀번호" className={inp} /></div>
          <button type="submit" className="btn btn-navy w-full py-2.5 text-[14px]">로그인</button>
          <div className="mt-2.5 flex justify-between text-[11px]"><Link href="/register/" className="text-[#E91E63]">회원가입</Link><button type="button" className="text-[#999]">아이디/비번 찾기</button></div>
          <hr className="my-4 border-[#eee]" />
          <div className="flex gap-2">
            <button type="button" className="flex-1 rounded py-2.5 text-[12px] font-bold bg-[#FEE500] text-black">카카오</button>
            <button type="button" className="flex-1 rounded py-2.5 text-[12px] font-bold bg-[#03C75A] text-white">네이버</button>
          </div>
        </form>
      </div>
    </div>
  );
}
