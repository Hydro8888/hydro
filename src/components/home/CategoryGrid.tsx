import React from 'react';
import Link from 'next/link';

interface CategoryItem {
  emoji: string;
  title: string;
  description: string;
  href: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    emoji: '🛵',
    title: '배달',
    description: '음식, 서류, 소포 등 원하는 것을 빠르고 안전하게 배달해 드립니다.',
    href: '/simburum/services?category=delivery',
  },
  {
    emoji: '🛒',
    title: '구매대행',
    description: '마트, 약국, 특정 매장 등 원하는 물품을 대신 구매해 드립니다.',
    href: '/simburum/services?category=shopping',
  },
  {
    emoji: '🧍',
    title: '줄서기',
    description: '맛집, 관공서, 병원 등 줄서기가 필요한 곳에 대신 줄 서 드립니다.',
    href: '/simburum/services?category=waiting',
  },
  {
    emoji: '🏢',
    title: '방문대행',
    description: '관공서, 은행, 우체국 등 방문이 필요한 업무를 대신 처리합니다.',
    href: '/simburum/services?category=visit',
  },
  {
    emoji: '🤝',
    title: '거래대행',
    description: '중고거래 직거래, 물품 수령·전달 등을 안전하게 대행합니다.',
    href: '/simburum/services?category=trade',
  },
  {
    emoji: '✨',
    title: '기타',
    description: '반려동물 돌봄, 청소, 짐 옮기기 등 다양한 생활 심부름을 맡겨보세요.',
    href: '/simburum/services?category=other',
  },
];

export default function CategoryGrid() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            어떤 심부름이 필요하세요?
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            다양한 카테고리에서 원하는 서비스를 찾아보세요
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="group block p-6 bg-white border border-gray-200 rounded-2xl transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary-200"
            >
              <div className="w-14 h-14 flex items-center justify-center bg-primary-50 group-hover:bg-primary-100 rounded-xl text-3xl transition-colors">
                {category.emoji}
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                {category.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {category.description}
              </p>
              <div className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                자세히 보기
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
