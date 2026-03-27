'use client';

import { useState } from 'react';
import { Check, ChevronRight, Shield } from 'lucide-react';

type Step = 1 | 2 | 3;
const TERMS = [{ id: 's', l: '이용약관 동의 (필수)' }, { id: 'p', l: '개인정보처리방침 동의 (필수)' }, { id: 'y', l: '청소년보호정책 동의 (필수)' }, { id: 'l', l: '위치정보 이용 동의 (필수)' }];
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '제주'];
const TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];

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
      <div className="flex border-b border-[#e0e0e0]">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium ${step === s ? 'border-b-2 border-[#C9A961] text-[#C9A961]' : step > s ? 'text-[#2E7D32]' : 'text-[#999]'}`}>
            {step > s && <Check className="h-3.5 w-3.5" />}{s === 1 ? '약관' : s === 2 ? '정보' : '프로필'}
          </div>
        ))}
      </div>
      <div className="p-5">
        {step === 1 && (<div>
          <div className="tag tag-urgent mb-4 block w-full text-center py-2.5 text-sm rounded-lg">본 서비스는 19세 이상만 이용 가능합니다</div>
          <label className="flex items-center gap-2.5 bg-[#f7f8fa] rounded-lg p-3 mb-3 cursor-pointer"><input type="checkbox" checked={allOk} onChange={toggleAll} className="accent-[#1E3A5F] h-4 w-4" /><span className="text-sm font-bold">전체 동의</span></label>
          {TERMS.map(t => <label key={t.id} className="flex items-center gap-2.5 p-2.5 cursor-pointer hover:bg-[#f7f8fa] rounded-lg"><input type="checkbox" checked={agreed.has(t.id)} onChange={() => toggle(t.id)} className="accent-[#1E3A5F] h-4 w-4" /><span className="text-sm">{t.l}</span></label>)}
          <button onClick={() => setStep(2)} disabled={!allOk} className="btn btn-navy w-full mt-5 py-2.5 disabled:opacity-40">다음 <ChevronRight className="h-4 w-4" /></button>
        </div>)}
        {step === 2 && (<div>
          <div className="space-y-3">
            {[{ l: '아이디', k: 'username', ph: '영문+숫자 4~12자' }, { l: '비밀번호', k: 'password', ph: '8자 이상', type: 'password' }, { l: '비밀번호 확인', k: 'passwordConfirm', ph: '', type: 'password' }, { l: '닉네임', k: 'nickname', ph: '프로필 닉네임' }, { l: '이메일 (선택)', k: 'email', ph: 'example@email.com', type: 'email' }].map(f => (
              <div key={f.k}><label className="text-xs text-[#999] mb-1.5 block">{f.l}</label><input type={f.type || 'text'} value={(form as any)[f.k]} onChange={e => setForm({...form, [f.k]: e.target.value})} placeholder={f.ph} className="input" /></div>
            ))}
          </div>
          <div className="mt-4 border border-[#C9A961] bg-[#FFFDE7] rounded-lg p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-bold mb-2"><Shield className="h-4 w-4 text-[#C9A961]" /> 성인인증 (필수)</h3>
            <p className="text-xs text-[#999] mb-3">본인인증을 통해 19세 이상임을 확인합니다.</p>
            {adult ? <p className="flex items-center gap-1.5 text-sm text-[#2E7D32] font-medium"><Check className="h-4 w-4" /> 인증 완료</p> : (
              <div className="flex gap-2"><button onClick={() => setAdult(true)} className="btn flex-1 py-2.5 border border-[#C9A961] text-[#C9A961] bg-white hover:bg-[#FFFDE7]">휴대폰 인증</button><button onClick={() => setAdult(true)} className="btn btn-outline flex-1 py-2.5">아이핀 인증</button></div>
            )}
          </div>
          <div className="mt-5 flex gap-2">
            <button onClick={() => setStep(1)} className="btn btn-outline px-5 py-2.5">이전</button>
            <button onClick={() => setStep(3)} disabled={!form.username || !form.password || !form.nickname || !adult} className="btn btn-navy flex-1 py-2.5 disabled:opacity-40">다음 <ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>)}
        {step === 3 && (<div>
          <div className="text-center mb-5">
            <div className="mx-auto w-16 h-16 bg-[#1E3A5F] rounded-full flex items-center justify-center text-3xl mb-2">🦊</div>
            <button className="text-sm text-[#E91E63] font-medium">프로필 사진 업로드</button>
          </div>
          <div className="mb-4"><p className="text-sm font-bold mb-2">희망 지역</p><div className="flex flex-wrap gap-1.5">{REGIONS.map(r => <button key={r} onClick={() => setRegions(p => p.includes(r) ? p.filter(x=>x!==r) : [...p,r])} className={`pill ${regions.includes(r) ? 'pill-active' : ''}`}>{r}</button>)}</div></div>
          <div className="mb-5"><p className="text-sm font-bold mb-2">희망 업종</p><div className="flex flex-wrap gap-1.5">{TYPES.map(t => <button key={t} onClick={() => setTypes(p => p.includes(t) ? p.filter(x=>x!==t) : [...p,t])} className={`pill ${types.includes(t) ? 'pill-active' : ''}`}>{t}</button>)}</div></div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="btn btn-outline px-5 py-2.5">이전</button>
            <button onClick={() => alert('가입 완료!')} className="btn btn-gold flex-1 py-2.5">가입 완료</button>
          </div>
        </div>)}
      </div>
    </div>
  );
}
