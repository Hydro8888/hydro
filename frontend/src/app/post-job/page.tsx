'use client';

import { useState } from 'react';
import { Star, Gem, Trophy, FileText, Upload } from 'lucide-react';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];
const BENEFITS = ['교통비 지원', '식사 제공', '숙박 가능', '당일 지급', '주급 가능', '경력 무관', '초보 환영', '유니폼 제공'];

const inp = "w-full rounded-xl border border-[#1E3A5F]/30 bg-[#112240] px-4 py-2.5 text-sm outline-none placeholder:text-[#64748B] focus:border-[#1E3A5F]";
const label = "mb-1.5 block text-xs font-medium text-[#94A3B8]";

const AD_TYPES = [
  { id: 'vvip', icon: Star, name: 'VVIP', desc: '최상위 노출', price: '월 50만원', color: '#C9A961' },
  { id: 'premium', icon: Gem, name: '우대등록', desc: '상위 노출', price: '월 30만원', color: '#94A3B8' },
  { id: 'standard', icon: Trophy, name: '프리미엄', desc: '일반 노출', price: '월 15만원', color: '#64748B' },
  { id: 'free', icon: FileText, name: '일반', desc: '기본 등록', price: '무료', color: '#64748B' },
];

export default function PostJobPage() {
  const [adType, setAdType] = useState('free');
  const [form, setForm] = useState({ name: '', region: '', address: '', phone: '', jobType: '', title: '', payType: 'daily', payAmount: '', hours: '', requirements: '', description: '' });
  const [benefits, setBenefits] = useState<string[]>([]);
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const tglBenefit = (b: string) => setBenefits(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <h1 className="mb-1 text-xl font-bold">광고등록</h1>
      <p className="mb-5 text-sm text-[#94A3B8]">구인공고를 등록하여 인재를 찾아보세요</p>

      {/* Ad Type */}
      <div className="mb-5">
        <h2 className="mb-3 text-sm font-semibold">광고 유형</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AD_TYPES.map(a => {
            const I = a.icon;
            const on = adType === a.id;
            return (
              <button key={a.id} onClick={() => setAdType(a.id)} className={`card-sm flex flex-col items-center p-3 text-center transition ${on ? 'border-[#C9A961]/50 bg-[#C9A961]/5' : 'hover:border-[#1E3A5F]/50'}`}>
                <I className="mb-1 h-5 w-5" style={{ color: a.color }} />
                <p className="text-xs font-semibold">{a.name}</p>
                <p className="text-[10px] text-[#64748B]">{a.desc}</p>
                <p className="mt-1 text-xs font-bold text-[#C9A961]">{a.price}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Business Info */}
      <div className="card p-5 mb-4">
        <h2 className="mb-4 text-sm font-semibold">업소 정보</h2>
        <div className="space-y-3">
          <div><label className={label}>업소명 *</label><input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="업소 이름" className={inp} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={label}>지역 *</label>
              <select value={form.region} onChange={e => set('region', e.target.value)} className={inp}><option value="">선택</option>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select>
            </div>
            <div><label className={label}>업종 *</label>
              <select value={form.jobType} onChange={e => set('jobType', e.target.value)} className={inp}><option value="">선택</option>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
            </div>
          </div>
          <div><label className={label}>상세 주소</label><input type="text" value={form.address} onChange={e => set('address', e.target.value)} placeholder="상세 주소" className={inp} /></div>
          <div><label className={label}>연락처 *</label><input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="010-0000-0000" className={inp} /></div>
        </div>
      </div>

      {/* Job Info */}
      <div className="card p-5 mb-4">
        <h2 className="mb-4 text-sm font-semibold">채용 조건</h2>
        <div className="space-y-3">
          <div><label className={label}>공고 제목 *</label><input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="예: 강남 프리미엄 라운지 스탭 모집" className={inp} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={label}>급여 형태 *</label>
              <select value={form.payType} onChange={e => set('payType', e.target.value)} className={inp}><option value="daily">일급</option><option value="hourly">시급</option><option value="monthly">월급</option></select>
            </div>
            <div><label className={label}>급여 금액 *</label><input type="text" value={form.payAmount} onChange={e => set('payAmount', e.target.value)} placeholder="예: 500,000" className={inp} /></div>
          </div>
          <div><label className={label}>근무시간</label><input type="text" value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="예: PM 8:00 ~ AM 3:00" className={inp} /></div>
          <div>
            <label className={label}>혜택</label>
            <div className="flex flex-wrap gap-1.5">
              {BENEFITS.map(b => (
                <button key={b} onClick={() => tglBenefit(b)} className={`rounded-lg px-3 py-1.5 text-xs transition ${benefits.includes(b) ? 'bg-[#1E3A5F] text-white' : 'bg-[#112240] text-[#94A3B8]'}`}>{b}</button>
              ))}
            </div>
          </div>
          <div><label className={label}>자격요건</label><input type="text" value={form.requirements} onChange={e => set('requirements', e.target.value)} placeholder="예: 19세 이상 여성" className={inp} /></div>
          <div><label className={label}>상세 설명 *</label><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5} placeholder="업소 소개 및 근무 조건을 자세히 작성해주세요" className={inp + ' resize-none'} /></div>
        </div>
      </div>

      {/* Images */}
      <div className="card p-5 mb-5">
        <h2 className="mb-3 text-sm font-semibold">이미지 (최대 5장)</h2>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <button key={i} className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-[#1E3A5F]/30 bg-[#112240] text-[#64748B] transition hover:border-[#1E3A5F] hover:text-[#94A3B8]">
              <Upload className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => alert('등록 완료! (MVP 데모)')} className="btn btn-gold w-full py-3 text-base">등록하기</button>
    </div>
  );
}
