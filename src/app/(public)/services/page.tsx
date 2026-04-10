import React from 'react';
import Link from 'next/link';

const SERVICES = [
  {
    id: 'daily',
    title: '생활대행',
    description: '바쁜 일상 속 소소한 일들을 대신 처리해드립니다. 은행 업무, 관공서 방문, 우편물 수령, 서류 제출 등 직접 방문이 어려운 업무를 맡겨보세요.',
    useCases: ['은행·관공서 업무 대행', '우편물·택배 수령 및 발송', '서류 출력·제출·수령', '각종 줄서기·대기', '공과금 납부·티켓 구매'],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    color: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  {
    id: 'delivery',
    title: '배달·구매대행',
    description: '필요한 물건을 대신 사서 배달해드립니다. 마트 장보기, 약국 방문, 특정 매장 물품 구매 등 직접 가기 어려운 쇼핑을 대행합니다.',
    useCases: ['마트·편의점 장보기', '약국 약품 구매', '특정 매장 물품 구매', '음식·간식 픽업 배달', '선물 구매 및 포장'],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
    color: 'bg-green-50 text-green-600 border-green-200',
  },
  {
    id: 'visit',
    title: '방문대행',
    description: '특정 장소를 대신 방문하여 업무를 처리합니다. 현장 확인, 물품 전달·수령, 사진 촬영 등 현장 방문이 필요한 업무를 대행합니다.',
    useCases: ['부동산 현장 확인', '물품 직거래 대행', '현장 사진·영상 촬영', '반려동물 병원 동행', '가전·가구 수령 대행'],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    color: 'bg-purple-50 text-purple-600 border-purple-200',
  },
  {
    id: 'trade',
    title: '거래대행',
    description: '중고거래, 물품 교환 등 거래 과정을 안전하게 대행합니다. 직거래 위험을 줄이고 물품 상태를 확인한 후 거래를 완료합니다.',
    useCases: ['중고거래 직거래 대행', '물품 상태 확인 후 구매', '반품·교환 대행', '경매·한정판 구매 대행', '물품 교환·전달'],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    color: 'bg-orange-50 text-orange-600 border-orange-200',
  },
  {
    id: 'b2b',
    title: '기업서비스 (B2B)',
    description: '기업 고객을 위한 맞춤형 대행 서비스입니다. 정기 배달, 사무실 관리, 직원 복지 심부름 등 기업 운영에 필요한 다양한 대행을 제공합니다.',
    useCases: ['정기 서류·물품 배달', '사무실 비품 구매 대행', '행사·이벤트 준비 보조', '직원 복지 심부름 패키지', '출장·외근 보조 서비스'],
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
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
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">서비스 소개</h1>
          <p className="mt-4 text-lg text-gray-600">
            심부름은 다양한 카테고리의 생활대행 서비스를 제공합니다
          </p>
        </div>

        <div className="space-y-8">
          {SERVICES.map((service) => (
            <div key={service.id} className={`card border-l-4 ${service.color.split(' ')[2]}`}>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${service.color.split(' ').slice(0, 2).join(' ')}`}>
                    {service.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h2>
                  <p className="text-gray-600 mb-4 leading-relaxed">{service.description}</p>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">이용 사례</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {service.useCases.map((uc) => (
                        <li key={uc} className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {uc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 card bg-red-50 border-red-200">
          <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            금지 업무
          </h2>
          <p className="text-sm text-red-700 mb-4">
            아래에 해당하는 요청은 AI 모더레이션에 의해 자동 차단되며, 반복 위반 시 계정이 정지될 수 있습니다.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROHIBITED.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-red-700">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 text-center">
          <Link href="/dashboard/requests/new" className="btn-primary text-lg py-3 px-8">
            지금 요청하기
          </Link>
        </div>
      </div>
    </div>
  );
}
