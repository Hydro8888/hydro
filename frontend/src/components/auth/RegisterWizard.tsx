'use client';

import { useState } from 'react';
import { Check, ChevronRight, Shield } from 'lucide-react';

type Step = 1 | 2 | 3;
const TERMS = [{ id: 'svc', l: '이용약관 동의 (필수)' }, { id: 'prv', l: '개인정보처리방침 동의 (필수)' }, { id: 'yth', l: '청소년보호정책 동의 (필수)' }, { id: 'loc', l: '위치정보 이용 동의 (필수)' }];
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '제주'];
const TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];

const inp = "w-full rounded-xl border border-[#2a1e3a] bg-[#1e142a] px-4 py-2.5 text-sm outline-none placeholder:text-[#6a5a7a] focus:border-[#e85d8a]";
const pill = (on: boolean) => `rounded-lg px-3 py-1.5 text-xs transition ${on ? 'bg-[#e85d8a] text-white' : 'bg-[#1e142a] text-[#9a8aa8]'}`;

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
      {/* Steps */}
      <div className="flex border-b border-[#2a1e3a]">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium ${step === s ? 'border-b-2 border-[#e85d8a] text-[#e85d8a]' : step > s ? 'text-[#4ade80]' : 'text-[#6a5a7a]'}`}>
            {step > s && <Check className="h-3.5 w-3.5" />}
            {s === 1 ? '약관' : s === 2 ? '정보' : '프로필'}
          </div>
        ))}
      </div>

      <div className="p-5">
        {step === 1 && (
          <div>
            <div className="mb-4 rounded-xl bg-[#ff6b6b]/10 p-3 text-center text-sm text-[#ff6b6b]">본 서비스는 19세 이상만 이용 가능합니다</div>
            <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-xl bg-[#1e142a] p-3">
              <input type="checkbox" checked={allOk} onChange={toggleAll} className="h-4 w-4 accent-[#e85d8a]" />
              <span className="font-medium">전체 동의</span>
            </label>
            <div className="space-y-1">
              {TERMS.map(t => (
                <label key={t.id} className="flex cursor-pointer items-center gap-3 rounded-xl p-3 hover:bg-[#1e142a]/50">
                  <input type="checkbox" checked={agreed.has(t.id)} onChange={() => toggle(t.id)} className="h-4 w-4 accent-[#e85d8a]" />
                  <span className="text-sm">{t.l}</span>
                </label>
              ))}
            </div>
            <button onClick={() => setStep(2)} disabled={!allOk} className="btn-primary mt-5 flex w-full items-center justify-center gap-1 py-2.5 text-sm disabled:opacity-40">다음 <ChevronRight className="h-4 w-4" /></button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs text-[#9a8aa8]">아이디</label><input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="영문+숫자 4~12자" className={inp} /></div>
              <div><label className="mb-1 block text-xs text-[#9a8aa8]">비밀번호</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="8자 이상, 특수문자 포함" className={inp} /></div>
              <div><label className="mb-1 block text-xs text-[#9a8aa8]">비밀번호 확인</label><input type="password" value={form.passwordConfirm} onChange={e => setForm({ ...form, passwordConfirm: e.target.value })} placeholder="비밀번호 확인" className={inp} /></div>
              <div><label className="mb-1 block text-xs text-[#9a8aa8]">닉네임</label><input type="text" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder="프로필 닉네임" className={inp} /></div>
              <div><label className="mb-1 block text-xs text-[#9a8aa8]">이메일 (선택)</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="비밀번호 찾기용" className={inp} /></div>
            </div>
            <div className="mt-5 rounded-xl border border-[#d4a76a]/30 bg-[#d4a76a]/5 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-sm"><Shield className="h-4 w-4 text-[#d4a76a]" /> 성인인증 (필수)</h3>
              <p className="mb-3 text-xs text-[#6a5a7a]">본인인증을 통해 19세 이상임을 확인합니다.</p>
              {adult ? (
                <p className="flex items-center gap-1.5 text-sm text-[#4ade80]"><Check className="h-4 w-4" /> 인증 완료</p>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setAdult(true)} className="flex-1 rounded-lg border border-[#d4a76a] bg-[#d4a76a]/10 py-2 text-sm text-[#d4a76a] hover:bg-[#d4a76a]/20">휴대폰 인증</button>
                  <button onClick={() => setAdult(true)} className="flex-1 rounded-lg border border-[#2a1e3a] py-2 text-sm text-[#9a8aa8] hover:text-[#d4a76a]">아이핀 인증</button>
                </div>
              )}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setStep(1)} className="rounded-xl border border-[#2a1e3a] px-5 py-2.5 text-sm text-[#9a8aa8]">이전</button>
              <button onClick={() => setStep(3)} disabled={!form.username || !form.password || !form.nickname || !adult} className="btn-primary flex flex-1 items-center justify-center gap-1 py-2.5 text-sm disabled:opacity-40">다음 <ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e85d8a]/20 to-[#c44dbb]/20 text-3xl">🦊</div>
              <button className="text-sm text-[#e85d8a]">프로필 사진 업로드</button>
            </div>
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium">희망 지역</h3>
              <div className="flex flex-wrap gap-1.5">{REGIONS.map(r => <button key={r} onClick={() => tglR(r)} className={pill(regions.includes(r))}>{r}</button>)}</div>
            </div>
            <div className="mb-5">
              <h3 className="mb-2 text-sm font-medium">희망 업종</h3>
              <div className="flex flex-wrap gap-1.5">{TYPES.map(t => <button key={t} onClick={() => tglT(t)} className={pill(types.includes(t))}>{t}</button>)}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="rounded-xl border border-[#2a1e3a] px-5 py-2.5 text-sm text-[#9a8aa8]">이전</button>
              <button onClick={() => alert('가입 완료!')} className="flex-1 rounded-xl bg-gradient-to-r from-[#e85d8a] to-[#d4a76a] py-2.5 text-sm font-semibold text-white">가입 완료</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
