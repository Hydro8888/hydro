import React from 'react';
import Link from 'next/link';

const SERVICES = [
  {
    id: 'daily',
    title: '생활대행',
    description: '바쁜 일상 속 소소한 일들을 대신 처리해드립니다. 청소, 세차, 짐옮기기 등 직접 하기 어려운 생활 업무를 맡겨보세요.',
    useCases: ['청소·정리정돈', '세차·차량 관리', '짐옮기기·이사 보조', '가전 설치·수리 접수', '반려동물 산책·돌봄'],
    borderColor: 'border-l-indigo-500',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  },
  {
    id: 'delivery',
    title: '배달·구매대행',
    description: '필요한 물건을 대신 사서 배달해드립니다. 음식, 물품, 한정판 등 직접 가기 어려운 쇼핑을 대행합니다.',
    useCases: ['마트·편의점 장보기', '음식·간식 픽업 배달', '특정 매장 물품 구매', '한정판·이벤트 상품 구매', '선물 구매 및 포장'],
    borderColor: 'border-l-teal-500',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    icon: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z',
  },
  {
    id: 'queue',
    title: '줄서기 대행',
    description: '긴 줄을 대신 서서 기다려드립니다. 맛집, 관공서, 이벤트 등 대기가 필요한 곳에서 시간을 절약하세요.',
    useCases: ['맛집·카페 줄서기', '관공서·은행 번호표 대기', '이벤트·콘서트 대기', '병원·약국 대기', '인기 매장 오픈런'],
    borderColor: 'border-l-coral-500',
    iconBg: 'bg-coral-50',
    iconColor: 'text-coral-600',
    icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    id: 'visit',
    title: '방문대행',
    description: '특정 장소를 대신 방문하여 업무를 처리합니다. 관공서, 은행, 병원 등 현장 방문이 필요한 업무를 대행합니다.',
    useCases: ['관공서 서류 제출·수령', '은행 업무 대행', '병원 접수·수납', '부동산 현장 확인', '우편물·택배 수령'],
    borderColor: 'border-l-purple-500',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    icon: 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z',
  },
  {
    id: 'trade',
    title: '거래대행',
    description: '중고거래, 택배수령 등 거래 과정을 안전하게 대행합니다. 직거래 위험을 줄이고 물품 상태를 확인 후 거래를 완료합니다.',
    useCases: ['중고거래 직거래 대행', '택배 수령·발송 대행', '물품 상태 확인 후 구매', '반품·교환 대행', '물품 교환·전달'],
    borderColor: 'border-l-amber-500',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5',
  },
];

const PROHIBITED = [
  '불법적인 활동 (마약, 도박, 불법 대리 등)',
  '성인·성적 서비스 관련 요청',
  '폭력, 위협, 혐오 표현이 포함된 요청',
  '개인정보 탈취 또는 사기 행위',
  '타인에게 해를 끼칠 수 있는 요청',
  '시험·자격증 대리 응시',
  '불법 촬영, 스토킹 등 범죄 관련 요청',
  '처방전 없는 의약품 구매 요청',
];

export default function ServicesPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-indigo-800 py-20 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            서비스 소개
          </h1>
          <p className="text-lg text-indigo-200 max-w-2xl mx-auto">
            Simburum은 다양한 카테고리의 생활대행 서비스를 제공합니다.
            <br className="hidden sm:block" />
            AI가 최적의 헬퍼를 매칭해드립니다.
          </p>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {SERVICES.map((service) => (
              <div
                key={service.id}
                id={service.id}
                className={`bg-white rounded-2xl shadow-sm border border-warm-100 p-6 sm:p-8 border-l-4 ${service.borderColor} transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-1`}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Icon */}
                  <div className="shrink-0">
                    <div className={`w-16 h-16 rounded-2xl ${service.iconBg} ${service.iconColor} flex items-center justify-center`}>
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={service.icon} />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-warm-900 mb-2">{service.title}</h2>
                    <p className="text-warm-500 mb-5 leading-relaxed">{service.description}</p>

                    <h3 className="text-sm font-semibold text-warm-700 mb-3">이용 사례</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {service.useCases.map((uc) => (
                        <li key={uc} className="flex items-center gap-2 text-sm text-warm-600">
                          <svg className="w-4 h-4 text-teal-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          {uc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prohibited Section */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              금지 요청
            </h2>
            <p className="text-sm text-red-700 mb-5 ml-[52px]">
              아래에 해당하는 요청은 AI 모더레이션에 의해 자동 차단되며, 반복 위반 시 계정이 정지될 수 있습니다.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-[52px]">
              {PROHIBITED.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-red-700">
                  <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            지금 바로 요청해보세요
          </h2>
          <p className="text-lg text-indigo-200 mb-8 max-w-xl mx-auto">
            AI가 최적의 헬퍼를 찾아 안전하게 매칭해드립니다
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/simburum/register"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-indigo-700 bg-white hover:bg-indigo-50 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
            >
              무료로 시작하기
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/simburum/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/10 rounded-xl transition-all duration-300"
            >
              요금 안내 보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
