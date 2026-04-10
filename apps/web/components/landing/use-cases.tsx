import { Code, PenLine, GraduationCap, TrendingUp } from 'lucide-react';
import { Section } from '@/components/ui/section';

const useCases = [
  {
    icon: Code,
    tag: 'Developers',
    title: '개발자를 위한 AI',
    quote: '여러 AI 모델을 비교해서 가장 정확한 코드를 얻을 수 있어요. 팀 전체가 활용 중입니다.',
    author: '김민수',
    role: 'Frontend Lead · 테크 스타트업',
  },
  {
    icon: PenLine,
    tag: 'Creators',
    title: '콘텐츠 크리에이터',
    quote: '각 AI의 강점을 파악하고 업무에 맞는 모델을 찾을 수 있었습니다. 작업 효율이 3배 올랐어요.',
    author: '이서연',
    role: 'Content Marketer · Agency',
  },
  {
    icon: GraduationCap,
    tag: 'Researchers',
    title: '연구원 & 학생',
    quote: '논문 분석과 번역 작업에 최적. 여러 모델 답변을 비교해서 정확도가 크게 올랐습니다.',
    author: '박준혁',
    role: 'PhD Candidate · 서울대',
  },
  {
    icon: TrendingUp,
    tag: 'Businesses',
    title: '기업 & 팀',
    quote: '하나의 구독으로 모든 AI를 팀원들과 함께 사용. 월 구독료 60% 절감했습니다.',
    author: '최지현',
    role: 'CEO · AI 컨설팅',
  },
];

export function UseCases() {
  return (
    <Section
      variant="gray"
      eyebrow="Customer Stories"
      title="모든 사람을 위한 AI 플랫폼"
      subtitle="개발자, 크리에이터, 연구원, 기업 - 각자의 방식으로 AI를 활용하고 있습니다"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {useCases.map((uc) => (
          <div
            key={uc.title}
            className="group p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 flex items-center justify-center shadow-xs">
                <uc.icon className="w-5 h-5 text-gray-900 dark:text-white" />
              </div>
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                {uc.tag}
              </span>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              {uc.title}
            </h3>

            <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              &ldquo;{uc.quote}&rdquo;
            </p>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                {uc.author.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {uc.author}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {uc.role}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
