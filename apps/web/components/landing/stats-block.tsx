import { Section } from '@/components/ui/section';

const stats = [
  { value: '12,000+', label: '활성 사용자', description: '매일 수천 명이 사용합니다' },
  { value: '500,000+', label: '생성된 대화', description: '누적 AI 대화 건수' },
  { value: '10', label: '프리미엄 모델', description: '최고의 AI를 한곳에' },
  { value: '99.9%', label: '가동 시간', description: '안정적인 서비스 보장' },
];

export function StatsBlock() {
  return (
    <Section
      variant="white"
      eyebrow="Our Impact"
      title="숫자로 보는 AI Portal Pro"
      subtitle="전 세계 사용자들이 선택한 신뢰받는 AI 플랫폼"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center md:text-left border-t border-gray-200 dark:border-gray-800 pt-6">
            <p className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
              {stat.value}
            </p>
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-1">
              {stat.label}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
