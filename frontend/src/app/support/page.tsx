import Link from 'next/link';
import { HelpCircle, FileText, MessageSquare, Phone, Mail, ChevronRight } from 'lucide-react';

const FAQ = [
  { q: '회원가입은 어떻게 하나요?', a: '메인 상단 "회원가입" 버튼으로 3단계 절차로 가입할 수 있습니다.' },
  { q: '성인인증은 필수인가요?', a: '네, 19세 이상 이용 가능하며 휴대폰 또는 아이핀 인증이 필수입니다.' },
  { q: '광고등록 비용은 얼마인가요?', a: 'VVIP(월50만), 우대(월30만), 프리미엄(월15만), 일반(무료) 4등급입니다.' },
  { q: '허위 공고를 발견했어요', a: '"신고" 버튼으로 신고해주세요. AI 필터링과 관리자 검토로 처리됩니다.' },
];

const MENUS = [
  { icon: FileText, label: '공지사항', desc: '서비스 공지' },
  { icon: HelpCircle, label: '자주묻는질문', desc: 'FAQ' },
  { icon: MessageSquare, label: '1:1 문의', desc: '상담/건의' },
  { icon: FileText, label: '제휴/광고 문의', desc: '비즈니스' },
  { icon: FileText, label: '광고수정/보완', desc: '등록 광고 수정' },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-[700px] px-3 py-4">
      <h1 className="text-[18px] font-bold mb-3">고객센터</h1>
      <div className="card p-4 mb-4 text-center border-[#E91E63]">
        <p className="text-[12px] text-[#888]">여우알바 고객센터</p>
        <p className="text-[22px] font-bold text-[#E91E63] mt-1">010-0000-0000</p>
        <p className="text-[11px] text-[#999] mt-0.5">상담시간: 평일 10:00 ~ 18:00 (주말·공휴일 휴무)</p>
        <div className="mt-2 flex justify-center gap-3 text-[11px] text-[#888]">
          <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" /> 전화문의</span>
          <span className="flex items-center gap-0.5"><Mail className="h-3 w-3" /> help@yeoualba.com</span>
        </div>
      </div>
      <div className="card mb-4 overflow-hidden">
        {MENUS.map((m, i) => { const I = m.icon; return (
          <button key={i} className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f9f9f9] ${i < MENUS.length - 1 ? 'border-b border-[#eee]' : ''}`}>
            <I className="h-4 w-4 text-[#999]" /><div className="flex-1"><p className="text-[13px] font-medium">{m.label}</p><p className="text-[10px] text-[#ccc]">{m.desc}</p></div><ChevronRight className="h-4 w-4 text-[#ccc]" />
          </button>
        ); })}
      </div>
      <h2 className="text-[14px] font-bold mb-2">자주 묻는 질문</h2>
      <div className="space-y-1.5">{FAQ.map((f, i) => (
        <details key={i} className="card group">
          <summary className="px-3 py-2.5 text-[13px] font-medium cursor-pointer list-none flex items-center justify-between">Q. {f.q}<ChevronRight className="h-4 w-4 text-[#ccc] group-open:rotate-90 transition" /></summary>
          <div className="border-t border-[#eee] px-3 py-2.5 text-[12px] text-[#555]">A. {f.a}</div>
        </details>
      ))}</div>
    </div>
  );
}
