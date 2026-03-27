'use client';

import { useState } from 'react';
import { Star, Gem, Trophy, FileText, Upload } from 'lucide-react';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];
const BENEFITS = ['교통비 지원', '식사 제공', '숙박 가능', '당일 지급', '주급 가능', '경력 무관', '초보 환영', '유니폼 제공'];

const ADS = [
  { id: 'vvip', icon: Star, name: 'VVIP', desc: '최상위 노출', price: '월 50만', color: '#C9A961' },
  { id: 'premium', icon: Gem, name: '우대등록', desc: '상위 노출', price: '월 30만', color: '#666' },
  { id: 'standard', icon: Trophy, name: '프리미엄', desc: '일반 노출', price: '월 15만', color: '#999' },
  { id: 'free', icon: FileText, name: '일반', desc: '기본', price: '무료', color: '#999' },
];

export default function PostJobPage() {
  const [adType, setAdType] = useState('free');
  const [form, setForm] = useState({ name: '', region: '', address: '', phone: '', jobType: '', title: '', payType: 'daily', payAmount: '', hours: '', requirements: '', description: '' });
  const [benefits, setBenefits] = useState<string[]>([]);
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="mx-auto max-w-[640px] px-4 py-5">
      <h1 className="text-xl font-bold mb-1">광고등록</h1>
      <p className="text-sm text-[#999] mb-5">구인공고를 등록하여 인재를 찾아보세요</p>

      <div className="mb-5">
        <p className="text-base font-bold mb-3">광고 유형</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ADS.map(a => { const I = a.icon; const on = adType === a.id; return (
            <button key={a.id} onClick={() => setAdType(a.id)} className={`card flex flex-col items-center p-4 text-center transition ${on ? 'border-[#C9A961] bg-[#FFFDE7]' : 'card-hover'}`}>
              <I className="h-6 w-6 mb-1.5" style={{ color: a.color }} />
              <p className="text-sm font-bold">{a.name}</p>
              <p className="text-xs text-[#999]">{a.desc}</p>
              <p className="text-sm font-bold text-[#C9A961] mt-1">{a.price}</p>
            </button>
          ); })}
        </div>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="text-base font-bold mb-4">업소 정보</h2>
        <div className="space-y-3">
          <div><label className="text-xs text-[#999] mb-1.5 block">업소명 *</label><input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="업소 이름" className="input" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-[#999] mb-1.5 block">지역 *</label><select value={form.region} onChange={e => set('region', e.target.value)} className="input"><option value="">선택</option>{REGIONS.map(r => <option key={r}>{r}</option>)}</select></div>
            <div><label className="text-xs text-[#999] mb-1.5 block">업종 *</label><select value={form.jobType} onChange={e => set('jobType', e.target.value)} className="input"><option value="">선택</option>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div><label className="text-xs text-[#999] mb-1.5 block">상세 주소</label><input type="text" value={form.address} onChange={e => set('address', e.target.value)} className="input" /></div>
          <div><label className="text-xs text-[#999] mb-1.5 block">연락처 *</label><input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="010-0000-0000" className="input" /></div>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <h2 className="text-base font-bold mb-4">채용 조건</h2>
        <div className="space-y-3">
          <div><label className="text-xs text-[#999] mb-1.5 block">공고 제목 *</label><input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="예: 강남 프리미엄 라운지 스탭 모집" className="input" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-[#999] mb-1.5 block">급여 형태</label><select value={form.payType} onChange={e => set('payType', e.target.value)} className="input"><option value="daily">일급</option><option value="hourly">시급</option><option value="monthly">월급</option></select></div>
            <div><label className="text-xs text-[#999] mb-1.5 block">급여 금액 *</label><input type="text" value={form.payAmount} onChange={e => set('payAmount', e.target.value)} placeholder="500,000" className="input" /></div>
          </div>
          <div><label className="text-xs text-[#999] mb-1.5 block">근무시간</label><input type="text" value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="PM 8:00 ~ AM 3:00" className="input" /></div>
          <div><label className="text-xs text-[#999] mb-1.5 block">혜택</label>
            <div className="flex flex-wrap gap-1.5">{BENEFITS.map(b => <button key={b} onClick={() => setBenefits(p => p.includes(b) ? p.filter(x=>x!==b) : [...p,b])} className={`pill ${benefits.includes(b) ? 'pill-active' : ''}`}>{b}</button>)}</div>
          </div>
          <div><label className="text-xs text-[#999] mb-1.5 block">자격요건</label><input type="text" value={form.requirements} onChange={e => set('requirements', e.target.value)} placeholder="19세 이상 여성" className="input" /></div>
          <div><label className="text-xs text-[#999] mb-1.5 block">상세 설명 *</label><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5} placeholder="근무 조건을 자세히 작성해주세요" className="input resize-none" /></div>
        </div>
      </div>

      <div className="card p-5 mb-5">
        <h2 className="text-base font-bold mb-3">이미지 (최대 5장)</h2>
        <div className="flex gap-3">{[1,2,3,4,5].map(i => <button key={i} className="w-16 h-16 border-2 border-dashed border-[#e0e0e0] rounded-lg flex items-center justify-center text-[#999] hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition"><Upload className="h-5 w-5" /></button>)}</div>
      </div>

      <button onClick={() => alert('등록 완료!')} className="btn btn-gold w-full py-3 text-base font-bold">등록하기</button>
    </div>
  );
}
