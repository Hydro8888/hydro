import { Section } from '@/components/ui/section';

const stats = [
  { value: '10+', label: '프리미엄 AI 모델', description: '세계 최고의 AI를 한곳에서' },
  { value: '9', label: 'AI 제공사', description: 'OpenAI부터 Mistral까지' },
  { value: '1M', label: '최대 컨텍스트 토큰', description: '초장문 문서도 한 번에 분석' },
  { value: '₩0', label: '시작 비용', description: '카드 등록 없이 무료 시작' },
];

export function StatsBlock() {
  return (
    <Section
      variant="white"
      eyebrow="성과 지표"
      title="숫자로 보는 AI Portal Pro"
      subtitle="과장 없이, 지금 바로 확인할 수 있는 플랫폼 스펙입니다"
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
