'use client';

import { useState } from 'react';
import { Check, ChevronRight, Shield } from 'lucide-react';

type Step = 1 | 2 | 3;
const TERMS = [{ id: 's', l: '이용약관 동의 (필수)' }, { id: 'p', l: '개인정보처리방침 동의 (필수)' }, { id: 'y', l: '청소년보호정책 동의 (필수)' }, { id: 'l', l: '위치정보 이용 동의 (필수)' }];
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '제주'];
const TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];

const inp = "w-full border border-[#ddd] rounded px-3 py-2 text-[13px] outline-none focus:border-[#1E3A5F]";
const pill = (on: boolean) => `border rounded px-2.5 py-1 text-[11px] cursor-pointer ${on ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-white text-[#555] border-[#ddd]'}`;

export function RegisterWizard() {
  const [step, setStep] = useState<Step>(1);
  const [agreed, setAgreed] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ username: '', password: '', passwordConfirm: '', nickname: '', email: '' });
  const [adult, setAdult] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  const allOk = TERMS.every(t => agreed.has(t.id));
  const toggleAll = () => setAgreed(allOk ? new Set() : new Set(TERMS.map(t => t.id)));
  const toggle = (id: string) => { const n = new Set(agreed); n.has(id) ? n.delete(id) : n.add(id); setAgreed(n); };

  return (
    <div className="card overflow-hidden">
      <div className="flex border-b border-[#eee]">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex flex-1 items-center justify-center gap-1 py-2.5 text-[12px] font-medium ${step === s ? 'border-b-2 border-[#C9A961] text-[#C9A961]' : step > s ? 'text-[#28a745]' : 'text-[#ccc]'}`}>
            {step > s && <Check className="h-3 w-3" />}{s === 1 ? '약관' : s === 2 ? '정보' : '프로필'}
          </div>
        ))}
      </div>
      <div className="p-4">
        {step === 1 && (<div>
          <div className="bg-[#FFF3CD] border border-[#FFEEBA] rounded p-2.5 text-center text-[12px] text-[#856404] mb-3">본 서비스는 19세 이상만 이용 가능합니다</div>
          <label className="flex items-center gap-2 bg-[#f9f9f9] rounded p-2.5 mb-2 cursor-pointer"><input type="checkbox" checked={allOk} onChange={toggleAll} className="accent-[#1E3A5F]" /><span className="text-[13px] font-bold">전체 동의</span></label>
          {TERMS.map(t => <label key={t.id} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-[#f9f9f9] rounded"><input type="checkbox" checked={agreed.has(t.id)} onChange={() => toggle(t.id)} className="accent-[#1E3A5F]" /><span className="text-[12px]">{t.l}</span></label>)}
          <button onClick={() => setStep(2)} disabled={!allOk} className="btn btn-navy w-full mt-4 py-2 flex items-center justify-center gap-1 disabled:opacity-40">다음 <ChevronRight className="h-4 w-4" /></button>
        </div>)}
        {step === 2 && (<div>
          <div className="space-y-2.5">
            <div><label className="text-[11px] text-[#888] mb-1 block">아이디</label><input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="영문+숫자 4~12자" className={inp} /></div>
            <div><label className="text-[11px] text-[#888] mb-1 block">비밀번호</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="8자 이상" className={inp} /></div>
            <div><label className="text-[11px] text-[#888] mb-1 block">비밀번호 확인</label><input type="password" value={form.passwordConfirm} onChange={e => setForm({...form, passwordConfirm: e.target.value})} className={inp} /></div>
            <div><label className="text-[11px] text-[#888] mb-1 block">닉네임</label><input type="text" value={form.nickname} onChange={e => setForm({...form, nickname: e.target.value})} className={inp} /></div>
            <div><label className="text-[11px] text-[#888] mb-1 block">이메일 (선택)</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inp} /></div>
          </div>
          <div className="mt-3 border border-[#C9A961] bg-[#FFFDE7] rounded p-3">
            <h3 className="flex items-center gap-1.5 text-[13px] font-bold mb-1.5"><Shield className="h-4 w-4 text-[#C9A961]" /> 성인인증 (필수)</h3>
            <p className="text-[11px] text-[#999] mb-2">본인인증을 통해 19세 이상임을 확인합니다.</p>
            {adult ? <p className="flex items-center gap-1 text-[12px] text-[#28a745]"><Check className="h-4 w-4" /> 인증 완료</p> : (
              <div className="flex gap-2"><button onClick={() => setAdult(true)} className="flex-1 btn border border-[#C9A961] text-[#C9A961] bg-white py-2 hover:bg-[#FFFDE7]">휴대폰 인증</button><button onClick={() => setAdult(true)} className="flex-1 btn border border-[#ddd] text-[#888] bg-white py-2">아이핀 인증</button></div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setStep(1)} className="btn border border-[#ddd] text-[#888] px-4 py-2 bg-white">이전</button>
            <button onClick={() => setStep(3)} disabled={!form.username || !form.password || !form.nickname || !adult} className="btn btn-navy flex-1 py-2 flex items-center justify-center gap-1 disabled:opacity-40">다음 <ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>)}
        {step === 3 && (<div>
          <div className="text-center mb-4">
            <div className="mx-auto w-[60px] h-[60px] bg-[#1E3A5F] rounded-full flex items-center justify-center text-2xl mb-1">🦊</div>
            <button className="text-[12px] text-[#E91E63]">프로필 사진 업로드</button>
          </div>
          <div className="mb-3"><p className="text-[12px] font-bold mb-1.5">희망 지역</p><div className="flex flex-wrap gap-1">{REGIONS.map(r => <button key={r} onClick={() => setRegions(p => p.includes(r) ? p.filter(x=>x!==r) : [...p,r])} className={pill(regions.includes(r))}>{r}</button>)}</div></div>
          <div className="mb-4"><p className="text-[12px] font-bold mb-1.5">희망 업종</p><div className="flex flex-wrap gap-1">{TYPES.map(t => <button key={t} onClick={() => setTypes(p => p.includes(t) ? p.filter(x=>x!==t) : [...p,t])} className={pill(types.includes(t))}>{t}</button>)}</div></div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn border border-[#ddd] text-[#888] px-4 py-2 bg-white">이전</button>
            <button onClick={() => alert('가입 완료!')} className="btn btn-gold flex-1 py-2">가입 완료</button>
          </div>
        </div>)}
      </div>
    </div>
  );
}
