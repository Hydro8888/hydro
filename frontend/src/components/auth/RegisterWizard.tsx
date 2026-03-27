'use client';

import { useState } from 'react';
import { Check, ChevronRight, Shield } from 'lucide-react';

type Step = 1 | 2 | 3;
const TERMS = [{ id: 'svc', l: '이용약관 동의 (필수)' }, { id: 'prv', l: '개인정보처리방침 동의 (필수)' }, { id: 'yth', l: '청소년보호정책 동의 (필수)' }, { id: 'loc', l: '위치정보 이용 동의 (필수)' }];
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '제주'];
const TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];

const inp = "w-full rounded-xl border border-[#1E3A5F]/30 bg-[#112240] px-4 py-2.5 text-sm outline-none placeholder:text-[#64748B] focus:border-[#1E3A5F]";
const pill = (on: boolean) => `rounded-lg px-3 py-1.5 text-xs transition ${on ? 'bg-[#1E3A5F] text-white' : 'bg-[#112240] text-[#94A3B8]'}`;

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
  const tglR = (r: string) => setRegions(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r]);
  const tglT = (t: string) => setTypes(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  return (
    <div className="card overflow-hidden">
      <div className="flex border-b border-[#1E3A5F]/20">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium ${step === s ? 'border-b-2 border-[#C9A961] text-[#C9A961]' : step > s ? 'text-[#10B981]' : 'text-[#64748B]'}`}>
            {step > s && <Check className="h-3.5 w-3.5" />}
            {s === 1 ? '약관' : s === 2 ? '정보' : '프로필'}
          </div>
        ))}
      </div>
      <div className="p-5">
        {step === 1 && (
          <div>
            <div className="mb-4 rounded-xl bg-[#F59E0B]/10 p-3 text-center text-sm text-[#F59E0B]">본 서비스는 19세 이상만 이용 가능합니다</div>
            <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl bg-[#112240] p-3"><input type="checkbox" checked={allOk} onChange={toggleAll} className="h-4 w-4 accent-[#1E3A5F]" /><span className="font-medium">전체 동의</span></label>
            <div className="space-y-1">{TERMS.map(t => (
              <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-xl p-3 hover:bg-[#112240]/50"><input type="checkbox" checked={agreed.has(t.id)} onChange={() => toggle(t.id)} className="h-4 w-4 accent-[#1E3A5F]" /><span className="text-sm">{t.l}</span></label>
            ))}</div>
            <button onClick={() => setStep(2)} disabled={!allOk} className="btn btn-navy mt-5 flex w-full items-center justify-center gap-1 py-2.5 disabled:opacity-40">다음 <ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
        {step === 2 && (
          <div>
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs text-[#94A3B8]">아이디</label><input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="영문+숫자 4~12자" className={inp} /></div>
              <div><label className="mb-1 block text-xs text-[#94A3B8]">비밀번호</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="8자 이상, 특수문자 포함" className={inp} /></div>
              <div><label className="mb-1 block text-xs text-[#94A3B8]">비밀번호 확인</label><input type="password" value={form.passwordConfirm} onChange={e => setForm({ ...form, passwordConfirm: e.target.value })} placeholder="비밀번호 확인" className={inp} /></div>
              <div><label className="mb-1 block text-xs text-[#94A3B8]">닉네임</label><input type="text" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder="프로필 닉네임" className={inp} /></div>
              <div><label className="mb-1 block text-xs text-[#94A3B8]">이메일 (선택)</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="비밀번호 찾기용" className={inp} /></div>
            </div>
            <div className="mt-5 rounded-xl border border-[#C9A961]/30 bg-[#C9A961]/5 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4 text-[#C9A961]" /> 성인인증 (필수)</h3>
              <p className="mb-3 text-xs text-[#64748B]">본인인증을 통해 19세 이상임을 확인합니다.</p>
              {adult ? <p className="flex items-center gap-1.5 text-sm text-[#10B981]"><Check className="h-4 w-4" /> 인증 완료</p> : (
                <div className="flex gap-2">
                  <button onClick={() => setAdult(true)} className="flex-1 rounded-lg border border-[#C9A961] bg-[#C9A961]/10 py-2 text-sm text-[#C9A961]">휴대폰 인증</button>
                  <button onClick={() => setAdult(true)} className="btn btn-outline flex-1 py-2 text-sm">아이핀 인증</button>
                </div>
              )}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setStep(1)} className="btn btn-outline px-5 py-2.5">이전</button>
              <button onClick={() => setStep(3)} disabled={!form.username || !form.password || !form.nickname || !adult} className="btn btn-navy flex flex-1 items-center justify-center gap-1 py-2.5 disabled:opacity-40">다음 <ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E3A5F]/20 text-3xl">🦊</div>
              <button className="text-sm text-[#C9A961]">프로필 사진 업로드</button>
            </div>
            <div className="mb-4"><h3 className="mb-2 text-sm font-medium">희망 지역</h3><div className="flex flex-wrap gap-1.5">{REGIONS.map(r => <button key={r} onClick={() => tglR(r)} className={pill(regions.includes(r))}>{r}</button>)}</div></div>
            <div className="mb-5"><h3 className="mb-2 text-sm font-medium">희망 업종</h3><div className="flex flex-wrap gap-1.5">{TYPES.map(t => <button key={t} onClick={() => tglT(t)} className={pill(types.includes(t))}>{t}</button>)}</div></div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="btn btn-outline px-5 py-2.5">이전</button>
              <button onClick={() => alert('가입 완료!')} className="btn btn-gold flex-1 py-2.5">가입 완료</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
