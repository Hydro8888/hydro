import { Star } from 'lucide-react';

const testimonials = [
  {
    name: '김민수',
    role: 'AI 스타트업 대표',
    quote: '여러 AI를 동시에 비교할 수 있어서 의사결정이 훨씬 빨라졌어요. 팀 전체가 활용하고 있습니다.',
    initial: '김',
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
  },
  {
    name: '이서연',
    role: '콘텐츠 마케터',
    quote: '각 AI의 강점을 파악하고 업무에 맞는 모델을 찾을 수 있었습니다. 콘텐츠 품질이 확실히 올랐어요.',
    initial: '이',
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
  },
  {
    name: '박준혁',
    role: '프리랜서 개발자',
    quote: '하나의 구독으로 모든 AI를 쓸 수 있다니, 비용 절약이 엄청나요. 코드 리뷰에 특히 유용합니다.',
    initial: '박',
    color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            사용자들의 이야기
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${t.color}`}>
                  {t.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
