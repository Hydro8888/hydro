import React from 'react';
import Link from 'next/link';

interface CategoryItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  href: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
    title: '배달 대행',
    description: '서류, 소포, 음식 등 원하는 것을 빠르고 안전하게 배달해 드립니다.',
    color: 'border-l-blue-500',
    bgColor: 'bg-blue-100 text-blue-600',
    href: '/simburum/services?category=delivery',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
    ),
    title: '구매 대행',
    description: '마트, 약국, 한정판 매장 등 원하는 물품을 대신 구매해 드립니다.',
    color: 'border-l-coral-500',
    bgColor: 'bg-coral-100 text-coral-600',
    href: '/simburum/services?category=shopping',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    title: '줄서기 대행',
    description: '맛집, 관공서, 병원 등 줄서기가 필요한 곳에 대신 줄 서 드립니다.',
    color: 'border-l-purple-500',
    bgColor: 'bg-purple-100 text-purple-600',
    href: '/simburum/services?category=waiting',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
    title: '방문 대행',
    description: '관공서, 은행, 우체국 등 방문이 필요한 업무를 대신 처리합니다.',
    color: 'border-l-teal-500',
    bgColor: 'bg-teal-100 text-teal-600',
    href: '/simburum/services?category=visit',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
        />
      </svg>
    ),
    title: '거래 대행',
    description: '중고거래 직거래, 물품 수령 및 전달 등을 안전하게 대행합니다.',
    color: 'border-l-amber-500',
    bgColor: 'bg-amber-100 text-amber-600',
    href: '/simburum/services?category=trade',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
    title: '기타 서비스',
    description: '반려동물 돌봄, 청소, 짐 옮기기 등 다양한 생활 심부름을 맡겨보세요.',
    color: 'border-l-indigo-500',
    bgColor: 'bg-indigo-100 text-indigo-600',
    href: '/simburum/services?category=other',
  },
];

export default function CategoryGrid() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <h2 className="section-header">어떤 심부름이 필요하세요?</h2>
          <p className="section-subtitle">
            다양한 카테고리에서 원하는 서비스를 찾아보세요
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className={`group block bg-white rounded-2xl border-l-4 ${category.color} p-6 shadow-sm border-y border-r border-warm-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl ${category.bgColor}`}
                >
                  {category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-warm-900 group-hover:text-indigo-600 transition-colors">
                      {category.title}
                    </h3>
                    <svg
                      className="w-5 h-5 text-warm-300 opacity-0 group-hover:opacity-100 group-hover:text-indigo-500 transition-all duration-300 transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                  <p className="mt-1.5 text-sm text-warm-500 leading-relaxed">
                    {category.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
