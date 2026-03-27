import Link from 'next/link';
import { HelpCircle, FileText, MessageSquare, Phone, Mail, ChevronRight } from 'lucide-react';

const FAQ = [
  { q: '회원가입은 어떻게 하나요?', a: '메인 화면 상단의 "회원가입" 버튼을 클릭하여 3단계 절차로 가입할 수 있습니다.' },
  { q: '성인인증은 필수인가요?', a: '네, 여우알바는 19세 이상 이용 가능하며 휴대폰 또는 아이핀 인증이 필수입니다.' },
  { q: '광고등록 비용은 얼마인가요?', a: 'VVIP(월50만), 우대(월30만), 프리미엄(월15만), 일반(무료) 4가지 등급이 있습니다.' },
  { q: '허위 공고를 발견했어요', a: '공고 상세 페이지의 "신고" 버튼으로 신고해주세요. AI 필터링과 관리자 검토로 처리됩니다.' },
  { q: '개인정보는 안전한가요?', a: '여우알바는 최소한의 개인정보만 수집하며, 한국 개인정보보호법을 준수합니다.' },
];

const MENUS = [
  { icon: FileText, label: '공지사항', desc: '서비스 공지 및 안내' },
  { icon: HelpCircle, label: '자주묻는질문', desc: 'FAQ 모음' },
  { icon: MessageSquare, label: '1:1 문의', desc: '상담 및 건의' },
  { icon: FileText, label: '제휴/광고 문의', desc: '비즈니스 문의' },
  { icon: FileText, label: '광고수정/보완', desc: '등록된 광고 수정' },
  { icon: FileText, label: '광고후기', desc: '광고 후기 작성' },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <h1 className="mb-1 text-xl font-bold">고객센터</h1>
      <p className="mb-5 text-sm text-[#94A3B8]">궁금한 점이나 문의사항이 있으시면 연락해주세요</p>

      {/* Contact */}
      <div className="card mb-5 p-5 text-center">
        <p className="text-sm text-[#94A3B8]">여우알바 고객센터</p>
        <p className="mt-2 text-2xl font-bold text-[#C9A961]">010-0000-0000</p>
        <p className="mt-1 text-xs text-[#64748B]">상담시간: 평일 10:00 ~ 18:00 (주말·공휴일 휴무)</p>
        <div className="mt-3 flex justify-center gap-3">
          <span className="flex items-center gap-1 text-xs text-[#94A3B8]"><Phone className="h-3 w-3" /> 전화문의</span>
          <span className="flex items-center gap-1 text-xs text-[#94A3B8]"><Mail className="h-3 w-3" /> help@yeoualba.com</span>
        </div>
      </div>

      {/* Menu */}
      <div className="card mb-5 overflow-hidden">
        {MENUS.map((m, i) => {
          const I = m.icon;
          return (
            <button key={i} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[#112240]/50 ${i < MENUS.length - 1 ? 'border-b border-[#1E3A5F]/15' : ''}`}>
              <I className="h-[18px] w-[18px] text-[#64748B]" />
              <div className="flex-1"><p className="text-sm font-medium">{m.label}</p><p className="text-[10px] text-[#64748B]">{m.desc}</p></div>
              <ChevronRight className="h-4 w-4 text-[#64748B]" />
            </button>
          );
        })}
      </div>

      {/* FAQ */}
      <h2 className="mb-3 text-base font-bold">자주 묻는 질문</h2>
      <div className="space-y-2">
        {FAQ.map((f, i) => (
          <details key={i} className="card-sm group">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium list-none flex items-center justify-between">
              <span>Q. {f.q}</span>
              <ChevronRight className="h-4 w-4 text-[#64748B] transition group-open:rotate-90" />
            </summary>
            <div className="border-t border-[#1E3A5F]/15 px-4 py-3 text-sm text-[#94A3B8]">A. {f.a}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
