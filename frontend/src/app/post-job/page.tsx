'use client';

import { useState } from 'react';
import { Star, Gem, Trophy, FileText, Upload } from 'lucide-react';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const TYPES = ['룸', '바', '노래방', '클럽', '라운지', '퍼브', '마사지', '기타'];
const BENEFITS = ['교통비 지원', '식사 제공', '숙박 가능', '당일 지급', '주급 가능', '경력 무관', '초보 환영', '유니폼 제공'];

const inp = "w-full border border-[#ddd] rounded px-3 py-2 text-[13px] outline-none focus:border-[#1E3A5F]";
const lbl = "text-[11px] text-[#888] mb-1 block";

const ADS = [
  { id: 'vvip', icon: Star, name: 'VVIP', desc: '최상위 노출', price: '월 50만', color: '#C9A961' },
  { id: 'premium', icon: Gem, name: '우대등록', desc: '상위 노출', price: '월 30만', color: '#888' },
  { id: 'standard', icon: Trophy, name: '프리미엄', desc: '일반 노출', price: '월 15만', color: '#aaa' },
  { id: 'free', icon: FileText, name: '일반', desc: '기본', price: '무료', color: '#ccc' },
];

export default function PostJobPage() {
  const [adType, setAdType] = useState('free');
  const [form, setForm] = useState({ name: '', region: '', address: '', phone: '', jobType: '', title: '', payType: 'daily', payAmount: '', hours: '', requirements: '', description: '' });
  const [benefits, setBenefits] = useState<string[]>([]);
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const tgl = (b: string) => setBenefits(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]);

  return (
    <div className="mx-auto max-w-[600px] px-3 py-4">
      <h1 className="text-[18px] font-bold mb-0.5">광고등록</h1>
      <p className="text-[12px] text-[#888] mb-4">구인공고를 등록하여 인재를 찾아보세요</p>

      <div className="mb-4">
        <p className="text-[13px] font-bold mb-2">광고 유형</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ADS.map(a => { const I = a.icon; const on = adType === a.id; return (
            <button key={a.id} onClick={() => setAdType(a.id)} className={`card flex flex-col items-center p-3 text-center ${on ? 'border-[#C9A961] bg-[#FFFDE7]' : 'hover:border-[#999]'}`}>
              <I className="h-5 w-5 mb-1" style={{ color: a.color }} />
              <p className="text-[12px] font-bold">{a.name}</p>
              <p className="text-[10px] text-[#999]">{a.desc}</p>
              <p className="text-[11px] font-bold text-[#C9A961] mt-0.5">{a.price}</p>
            </button>
          ); })}
        </div>
      </div>

      <div className="card p-4 mb-3">
        <h2 className="text-[14px] font-bold mb-3">업소 정보</h2>
        <div className="space-y-2.5">
          <div><label className={lbl}>업소명 *</label><input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="업소 이름" className={inp} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>지역 *</label><select value={form.region} onChange={e => set('region', e.target.value)} className={inp}><option value="">선택</option>{REGIONS.map(r => <option key={r}>{r}</option>)}</select></div>
            <div><label className={lbl}>업종 *</label><select value={form.jobType} onChange={e => set('jobType', e.target.value)} className={inp}><option value="">선택</option>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div><label className={lbl}>상세 주소</label><input type="text" value={form.address} onChange={e => set('address', e.target.value)} className={inp} /></div>
          <div><label className={lbl}>연락처 *</label><input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="010-0000-0000" className={inp} /></div>
        </div>
      </div>

      <div className="card p-4 mb-3">
        <h2 className="text-[14px] font-bold mb-3">채용 조건</h2>
        <div className="space-y-2.5">
          <div><label className={lbl}>공고 제목 *</label><input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="예: 강남 프리미엄 라운지 스탭 모집" className={inp} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>급여 형태 *</label><select value={form.payType} onChange={e => set('payType', e.target.value)} className={inp}><option value="daily">일급</option><option value="hourly">시급</option><option value="monthly">월급</option></select></div>
            <div><label className={lbl}>급여 금액 *</label><input type="text" value={form.payAmount} onChange={e => set('payAmount', e.target.value)} placeholder="500,000" className={inp} /></div>
          </div>
          <div><label className={lbl}>근무시간</label><input type="text" value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="PM 8:00 ~ AM 3:00" className={inp} /></div>
          <div><label className={lbl}>혜택</label>
            <div className="flex flex-wrap gap-1">{BENEFITS.map(b => <button key={b} onClick={() => tgl(b)} className={`border rounded px-2.5 py-1 text-[11px] ${benefits.includes(b) ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'bg-white text-[#555] border-[#ddd]'}`}>{b}</button>)}</div>
          </div>
          <div><label className={lbl}>자격요건</label><input type="text" value={form.requirements} onChange={e => set('requirements', e.target.value)} placeholder="19세 이상 여성" className={inp} /></div>
          <div><label className={lbl}>상세 설명 *</label><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5} placeholder="근무 조건을 자세히 작성해주세요" className={inp + ' resize-none'} /></div>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <h2 className="text-[14px] font-bold mb-2">이미지 (최대 5장)</h2>
        <div className="flex gap-2">{[1,2,3,4,5].map(i => <button key={i} className="w-[60px] h-[60px] border border-dashed border-[#ccc] rounded flex items-center justify-center text-[#ccc] hover:border-[#1E3A5F] hover:text-[#1E3A5F]"><Upload className="h-5 w-5" /></button>)}</div>
      </div>

      <button onClick={() => alert('등록 완료! (MVP)')} className="btn btn-gold w-full py-3 text-[15px]">등록하기</button>
    </div>
  );
}
