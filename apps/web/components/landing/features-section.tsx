import { Layers, Shield, Zap, BarChart3, Users, Sparkles } from 'lucide-react';
import { Section } from '@/components/ui/section';

const features = [
  {
    icon: Layers,
    title: '멀티모델 비교',
    description: '최대 4개 AI를 동시에 비교하세요. 같은 질문, 다른 관점. 최적의 AI를 찾아보세요.',
  },
  {
    icon: Shield,
    title: '안전한 통합 결제',
    description: '개별 AI 구독 대신 하나의 요금제로 모든 모델을 이용할 수 있습니다.',
  },
  {
    icon: Zap,
    title: '실시간 스트리밍',
    description: '모든 모델에서 실시간 응답 스트리밍을 지원합니다. 빠르고 자연스러운 대화 경험.',
  },
  {
    icon: BarChart3,
    title: '사용량 분석',
    description: '토큰 사용량, 비용, 모델별 성능을 한눈에 확인하고 관리하세요.',
  },
  {
    icon: Users,
    title: '팀 협업',
    description: '팀원들과 대화를 공유하고 함께 AI를 활용하세요. 워크스페이스 지원.',
  },
  {
    icon: Sparkles,
    title: '스마트 템플릿',
    description: '미리 준비된 프롬프트 템플릿으로 빠르게 시작하세요. 코드, 글쓰기, 분석 등.',
  },
];

export function FeaturesSection() {
  return (
    <Section
      id="features"
      variant="white"
      eyebrow="기능"
      title="하나의 플랫폼, 무한한 가능성"
      subtitle="복잡한 AI 구독을 통합하고 팀의 생산성을 높이는 모든 기능"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex gap-4 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow duration-200"
          >
            <div className="shrink-0">
              <div className="w-11 h-11 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 flex items-center justify-center shadow-xs">
                <feature.icon className="w-5 h-5 text-gray-900 dark:text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
