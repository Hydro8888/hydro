'use client';

import { Lightbulb, Code, FileText, Languages, Image as ImageIcon, BarChart3, Sparkles, BookOpen, Palette, Briefcase } from 'lucide-react';
import { useModelStore } from '@/stores/model-store';
import { getModelConfig } from '@ai-portal/shared';

interface TemplateCard {
  label: string;
  subtitle: string;
  icon: typeof Lightbulb;
  prompt: string;
  gradient: string;
  textColor: string;
}

const templates: TemplateCard[] = [
  {
    label: '아이디어',
    subtitle: 'Brainstorm',
    icon: Lightbulb,
    prompt: '새로운 비즈니스 아이디어를 5개 제안해주고 각각의 장단점을 분석해줘',
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    textColor: 'text-white',
  },
  {
    label: '코드 작성',
    subtitle: 'Code Gen',
    icon: Code,
    prompt: 'Python으로 웹 스크래퍼를 만들어줘. BeautifulSoup과 requests를 사용해서',
    gradient: 'from-blue-600 via-indigo-600 to-purple-700',
    textColor: 'text-white',
  },
  {
    label: '글쓰기',
    subtitle: 'Writing',
    icon: FileText,
    prompt: '블로그 포스트 초안을 작성해줘. 주제는 "AI의 미래"',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    textColor: 'text-white',
  },
  {
    label: '번역',
    subtitle: 'Translate',
    icon: Languages,
    prompt: '이 한국어 문장을 자연스러운 영어로 번역해줘',
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    textColor: 'text-white',
  },
  {
    label: '이미지 분석',
    subtitle: 'Vision',
    icon: ImageIcon,
    prompt: '이미지를 업로드하면 어떤 내용인지 자세히 분석해줘',
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
    textColor: 'text-white',
  },
  {
    label: '데이터 분석',
    subtitle: 'Data',
    icon: BarChart3,
    prompt: 'CSV 데이터를 분석하고 주요 인사이트를 요약해줘',
    gradient: 'from-slate-700 via-gray-700 to-zinc-800',
    textColor: 'text-white',
  },
  {
    label: '리서치',
    subtitle: 'Research',
    icon: Sparkles,
    prompt: '최신 AI 트렌드를 조사하고 핵심 포인트를 정리해줘',
    gradient: 'from-yellow-400 via-amber-500 to-orange-600',
    textColor: 'text-white',
  },
  {
    label: '학습',
    subtitle: 'Learning',
    icon: BookOpen,
    prompt: '머신러닝의 기초 개념을 초보자도 이해할 수 있게 설명해줘',
    gradient: 'from-green-600 via-emerald-600 to-teal-700',
    textColor: 'text-white',
  },
  {
    label: '디자인',
    subtitle: 'Design',
    icon: Palette,
    prompt: '웹사이트 UI/UX 디자인 아이디어를 제안해줘. 모던한 스타일로',
    gradient: 'from-rose-400 via-pink-500 to-fuchsia-600',
    textColor: 'text-white',
  },
  {
    label: '비즈니스',
    subtitle: 'Business',
    icon: Briefcase,
    prompt: '스타트업 피치덱을 만들기 위한 핵심 슬라이드 구조를 제안해줘',
    gradient: 'from-indigo-700 via-blue-800 to-slate-900',
    textColor: 'text-white',
  },
];

interface SamplePromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

export function SamplePrompts({ onSelectPrompt }: SamplePromptsProps) {
  const selectedModelId = useModelStore((s) => s.selectedModelIds[0]);
  const modelConfig = selectedModelId ? getModelConfig(selectedModelId) : undefined;

  return (
    <div className="flex flex-col items-center justify-start h-full overflow-y-auto px-4 py-8 md:py-12">
      <div className="w-full max-w-5xl mx-auto">
        {/* Hero brand logo */}
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent mb-3">
            FREE.AI
          </h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium">
            하나의 대시보드에서 세계 최고의 AI를 만나세요
          </p>

          {modelConfig && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mt-4 border"
              style={{
                backgroundColor: `${modelConfig.color}10`,
                color: modelConfig.color,
                borderColor: `${modelConfig.color}30`,
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: modelConfig.color }} />
              {modelConfig.displayName} 활성
            </div>
          )}
        </div>

        {/* Section label */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            템플릿 선택
          </h2>
          <span className="text-xs text-gray-400">
            {templates.length}개의 프롬프트
          </span>
        </div>

        {/* Template gallery grid — 2 rows of 5 on desktop, responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {templates.map((t) => (
            <button
              key={t.label}
              onClick={() => onSelectPrompt(t.prompt)}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient}`} />

              {/* Subtle pattern overlay */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                }}
              />

              {/* Content */}
              <div className="relative h-full flex flex-col justify-between p-4">
                {/* Top: icon */}
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <t.icon className={`w-4.5 h-4.5 ${t.textColor}`} />
                  </div>
                </div>

                {/* Bottom: label */}
                <div className="text-left">
                  <p className={`text-[10px] uppercase tracking-wider font-medium ${t.textColor} opacity-80 mb-0.5`}>
                    {t.subtitle}
                  </p>
                  <p className={`text-base md:text-lg font-bold ${t.textColor} leading-tight`}>
                    {t.label}
                  </p>
                </div>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <p className="text-xs text-gray-400 text-center mt-8">
          템플릿을 클릭하거나 아래에서 직접 메시지를 입력하세요
        </p>
      </div>
    </div>
  );
}
