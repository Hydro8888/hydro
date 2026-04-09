import { UserPlus, MousePointer, MessageCircle } from 'lucide-react';

const steps = [
  { icon: UserPlus, num: '1', title: '무료 가입', desc: '이메일 하나로 30초 만에 가입 완료' },
  { icon: MousePointer, num: '2', title: '모델 선택', desc: '원하는 AI 모델을 클릭 한 번으로 선택' },
  { icon: MessageCircle, num: '3', title: '대화 시작', desc: '바로 AI와 대화를 시작하세요' },
];

export function HowItWorks() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            3단계로 시작하세요
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            복잡한 설정 없이, 지금 바로
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => (
            <div key={step.num} className="relative flex flex-col items-center text-center">
              {/* Connecting line (desktop only) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-7 left-[60%] w-[80%] border-t-2 border-dashed border-gray-200 dark:border-gray-700" />
              )}

              <div className="relative z-10 w-14 h-14 rounded-full bg-primary-500 text-white text-xl font-bold flex items-center justify-center mb-4 shadow-lg shadow-primary-500/20">
                {step.num}
              </div>

              <step.icon className="w-6 h-6 text-primary-400 mb-3" />
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
