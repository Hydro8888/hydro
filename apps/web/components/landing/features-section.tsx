import { Layers, Shield, Zap, BarChart3 } from 'lucide-react';

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
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 text-xs font-medium mb-4">
            Why AI Portal Pro
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            하나의 플랫폼, 무한한 가능성
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            복잡한 AI 구독을 하나로 통합하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950 flex items-center justify-center mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-900 transition-colors">
                <feature.icon className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
