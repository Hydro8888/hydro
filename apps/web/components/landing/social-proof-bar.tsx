import { Users, MessageSquare, Cpu, Building2 } from 'lucide-react';

const stats = [
  { icon: Users, value: '12,000+', label: '활성 사용자' },
  { icon: MessageSquare, value: '500,000+', label: 'AI 대화 생성' },
  { icon: Cpu, value: '10', label: '프리미엄 모델' },
  { icon: Building2, value: '9', label: 'AI 제공사' },
];

export function SocialProofBar() {
  return (
    <section className="py-10 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center text-center">
            <stat.icon className="w-5 h-5 text-primary-400 mb-2" />
            <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </span>
            <span className="text-xs text-gray-500 mt-1">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
