import React from 'react';

const SECTIONS = [
  {
    title: '실명 인증',
    description: '심부름의 모든 사용자는 본인 확인 절차를 통해 실명이 인증됩니다. 전화번호 인증은 필수이며, 헬퍼의 경우 추가적인 신원 확인을 거칩니다.',
    details: [
      '가입 시 전화번호 본인 인증 필수',
      '헬퍼 지원 시 신분증 사본 확인',
      '인증 완료 사용자에게 인증 배지 부여',
      '미인증 사용자의 서비스 이용 제한',
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
      </svg>
    ),
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: '요청자 검증',
    description: '모든 요청은 AI가 자동으로 검토하여 불법·부적절한 내용을 사전에 차단합니다. 위험도가 높은 요청은 운영팀이 수동으로 추가 검토합니다.',
    details: [
      'AI 기반 콘텐츠 모더레이션 (자동 검토)',
      '위험도 3단계 분류 (LOW, MEDIUM, HIGH)',
      'HIGH 위험도 요청은 관리자 수동 승인 필요',
      '반복 위반 시 자동 경고 및 계정 정지',
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: 'bg-green-50 text-green-600',
  },
  {
    title: '헬퍼 검증',
    description: '헬퍼로 활동하려면 엄격한 검증 절차를 통과해야 합니다. 전문 분야에 대한 경험과 역량을 확인하고, 지속적으로 서비스 품질을 모니터링합니다.',
    details: [
      '신분증 기반 실명·성인 인증',
      '카테고리별 전문성 확인',
      '서비스 수행 후 품질 모니터링',
      '평점 기준 미달 시 활동 제한',
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    color: 'bg-purple-50 text-purple-600',
  },
  {
    title: '양방향 리뷰',
    description: '요청이 완료되면 요청자와 헬퍼 모두 상대방에 대한 리뷰를 작성합니다. 정확도, 친절도, 시간 준수 등 다차원 평가로 신뢰도를 쌓아갑니다.',
    details: [
      '요청자 → 헬퍼 리뷰 (정확도, 친절도, 시간 준수)',
      '헬퍼 → 요청자 리뷰 (소통, 매너)',
      '리뷰 기반 신뢰 점수(Trust Score) 산출',
      '허위 리뷰 탐지 및 제재',
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    title: '금지 요청 정책',
    description: 'AI 모더레이션이 불법·부적절한 요청을 자동으로 탐지하고 차단합니다. 사용자의 안전을 최우선으로 하며, 금지 항목 위반 시 즉시 조치합니다.',
    details: [
      '불법 활동 요청 즉시 차단',
      '성인·폭력·혐오 콘텐츠 자동 필터링',
      '개인정보 탈취·사기 시도 탐지',
      '위반 시 경고 → 일시정지 → 영구정지 순차 제재',
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    color: 'bg-red-50 text-red-600',
  },
  {
    title: '분쟁 처리',
    description: '서비스 이용 중 문제가 발생하면 분쟁 처리 프로세스를 통해 공정하게 해결합니다. 에스크로 시스템으로 결제금을 안전하게 보호합니다.',
    details: [
      '에스크로 결제로 선불금 안전 보관',
      '분쟁 신고 시 즉시 결제 동결',
      '운영팀 중재를 통한 공정한 해결',
      '환불·보상 기준 명확 안내',
    ],
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    ),
    color: 'bg-indigo-50 text-indigo-600',
  },
];

export default function SafetyPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">안전·신뢰</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            심부름은 다층적 안전 장치와 AI 기반 검증 시스템으로 모든 이용자를 보호합니다
          </p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.title} className="card">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${section.color}`}>
                    {section.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{section.title}</h2>
                  <p className="text-gray-600 mb-4 leading-relaxed">{section.description}</p>
                  <ul className="space-y-2">
                    {section.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 mt-0.5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
