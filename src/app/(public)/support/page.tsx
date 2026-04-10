'use client';

import React, { useState } from 'react';

const FAQS = [
  {
    q: '심부름은 어떤 서비스인가요?',
    a: '심부름은 AI 기반 생활대행·심부름 매칭 플랫폼입니다. 배달, 구매대행, 줄서기, 방문대행, 거래대행 등 일상생활에서 필요한 다양한 심부름을 검증된 헬퍼와 안전하게 연결해드립니다.',
  },
  {
    q: '플랫폼 수수료가 정말 무료인가요?',
    a: '네, 현재 심부름 플랫폼 이용 수수료는 0원입니다. 요청 등록, AI 분석, 매칭 서비스 모두 무료로 제공됩니다. 헬퍼에게 지급하는 서비스 비용만 부담하시면 됩니다.',
  },
  {
    q: '헬퍼는 어떻게 검증되나요?',
    a: '모든 헬퍼는 실명 인증(전화번호 인증, 신분증 확인)을 완료해야 활동할 수 있습니다. 또한 활동 후에는 양방향 리뷰 시스템을 통해 지속적으로 서비스 품질이 관리됩니다.',
  },
  {
    q: '결제는 어떻게 이루어지나요?',
    a: '에스크로 결제 방식을 사용합니다. 요청자가 결제한 금액은 플랫폼에 안전하게 보관되며, 작업이 완료되고 요청자가 확인한 후에 헬퍼에게 지급됩니다.',
  },
  {
    q: '요청을 취소할 수 있나요?',
    a: '헬퍼가 아직 수락하지 않은 요청은 언제든 무료로 취소할 수 있습니다. 헬퍼가 수락한 후에는 진행 상황에 따라 취소 수수료가 발생할 수 있습니다.',
  },
  {
    q: '어떤 요청은 할 수 없나요?',
    a: '불법적인 활동, 성인 서비스, 폭력·위협 관련 요청, 개인정보 탈취, 시험 대리 응시 등은 AI 모더레이션에 의해 자동 차단됩니다. 자세한 내용은 서비스 소개 페이지의 금지 업무 항목을 참고해주세요.',
  },
  {
    q: '분쟁이 발생하면 어떻게 하나요?',
    a: '서비스 이용 중 문제가 발생하면 대시보드에서 신고를 접수할 수 있습니다. 운영팀이 양측의 의견을 듣고 공정하게 중재하며, 필요 시 에스크로 자금의 환불 처리를 진행합니다.',
  },
  {
    q: '헬퍼로 활동하려면 어떻게 해야 하나요?',
    a: '헬퍼 지원 페이지에서 지원서를 작성해주세요. 기본 정보와 전문 분야를 입력하고 신원 확인을 완료하면 운영팀의 심사를 거쳐 승인됩니다. 보통 1~3 영업일 내에 결과를 안내합니다.',
  },
  {
    q: '서비스 이용 가능 지역은 어디인가요?',
    a: '현재 전국 주요 도시에서 서비스를 운영하고 있으며, 점차 서비스 지역을 확대하고 있습니다. 지역에 따라 이용 가능한 헬퍼 수가 다를 수 있습니다.',
  },
  {
    q: '헬퍼의 수입은 얼마나 되나요?',
    a: '헬퍼의 수입은 수행하는 요청의 종류와 횟수에 따라 달라집니다. 요청별 서비스 비용은 AI가 카테고리와 작업량을 분석하여 적정 범위를 제안하며, 최종 금액은 요청자와 헬퍼 간 합의로 결정됩니다.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 pr-4">{q}</span>
        <svg
          className={`w-5 h-5 text-gray-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">고객지원</h1>
          <p className="mt-4 text-lg text-gray-600">자주 묻는 질문과 연락처 안내</p>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">자주 묻는 질문 (FAQ)</h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        <section id="contact" className="card mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">문의하기</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">이메일 문의</h3>
                <p className="text-sm text-gray-600 mt-1">support@simburum.kr</p>
                <p className="text-xs text-gray-500 mt-0.5">24시간 접수, 1영업일 내 답변</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">전화 문의</h3>
                <p className="text-sm text-gray-600 mt-1">1588-0000</p>
                <p className="text-xs text-gray-500 mt-0.5">평일 09:00 ~ 18:00 (공휴일 제외)</p>
              </div>
            </div>
          </div>
        </section>

        <section id="terms" className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">이용약관</h2>
          <div className="card text-sm text-gray-600 leading-relaxed space-y-3">
            <p>
              본 서비스는 생활대행·심부름 매칭 플랫폼으로, 요청자와 헬퍼 간의 연결을 중개합니다.
              플랫폼은 거래의 직접 당사자가 아니며, 서비스 품질에 대한 최종 책임은 서비스를 수행하는 헬퍼에게 있습니다.
            </p>
            <p>
              이용자는 서비스 이용 시 타인의 권리를 침해하거나 법령에 위반되는 행위를 해서는 안 됩니다.
              위반 시 서비스 이용이 제한되거나 법적 책임을 질 수 있습니다.
            </p>
            <p>
              자세한 이용약관은 별도 공지를 통해 안내됩니다.
            </p>
          </div>
        </section>

        <section id="privacy">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">개인정보처리방침</h2>
          <div className="card text-sm text-gray-600 leading-relaxed space-y-3">
            <p>
              심부름은 이용자의 개인정보를 소중히 보호합니다.
              수집하는 개인정보는 서비스 제공 및 이용자 인증을 위해 필요한 최소한의 정보(이름, 이메일, 전화번호)입니다.
            </p>
            <p>
              수집된 개인정보는 서비스 제공 목적 외에 사용되지 않으며,
              법령에 의한 경우를 제외하고 제3자에게 제공되지 않습니다.
              이용자는 언제든지 자신의 개인정보를 열람·수정·삭제할 수 있습니다.
            </p>
            <p>
              자세한 개인정보처리방침은 별도 공지를 통해 안내됩니다.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
