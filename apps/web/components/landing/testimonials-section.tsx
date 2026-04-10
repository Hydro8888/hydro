import { Section } from '@/components/ui/section';

const testimonials = [
  {
    quote:
      '여러 AI를 동시에 비교할 수 있어서 의사결정이 훨씬 빨라졌어요. 팀 전체가 매일 사용하고 있습니다.',
    name: '김민수',
    role: 'AI 스타트업 대표',
    initial: '김',
  },
  {
    quote:
      '각 AI의 강점을 파악하고 업무에 맞는 모델을 찾을 수 있었습니다. 콘텐츠 품질이 확실히 올랐어요.',
    name: '이서연',
    role: 'Senior Content Marketer',
    initial: '이',
  },
  {
    quote:
      '하나의 구독으로 모든 AI를 쓸 수 있다니, 비용 절약이 엄청나요. 코드 리뷰에 특히 유용합니다.',
    name: '박준혁',
    role: 'Freelance Developer',
    initial: '박',
  },
];

export function TestimonialsSection() {
  return (
    <Section
      variant="white"
      eyebrow="Testimonials"
      title="사용자들이 말하는 AI Portal Pro"
      subtitle="매일 수천 명의 전문가들이 선택한 AI 플랫폼"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col"
          >
            {/* Quote mark */}
            <div className="text-5xl leading-none text-gray-300 dark:text-gray-700 font-serif mb-2">
              &ldquo;
            </div>

            <blockquote className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6 flex-1">
              {t.quote}
            </blockquote>

            <figcaption className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-200 dark:to-white flex items-center justify-center text-white dark:text-gray-900 font-semibold text-sm">
                {t.initial}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
