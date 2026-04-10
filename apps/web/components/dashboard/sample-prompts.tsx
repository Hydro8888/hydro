'use client';

import {
  Lightbulb,
  Code,
  FileText,
  Languages,
  Image as ImageIcon,
  BarChart3,
  Sparkles,
  BookOpen,
  Palette,
  Briefcase,
} from 'lucide-react';
import { useModelStore } from '@/stores/model-store';
import { getModelConfig } from '@ai-portal/shared';
import { Badge } from '@/components/ui/badge';

interface TemplateCard {
  label: string;
  subtitle: string;
  icon: typeof Lightbulb;
  prompt: string;
  iconColor: string;
  iconBg: string;
}

const templates: TemplateCard[] = [
  {
    label: '아이디어 브레인스토밍',
    subtitle: 'Brainstorm',
    icon: Lightbulb,
    prompt: '새로운 비즈니스 아이디어를 5개 제안해주고 각각의 장단점을 분석해줘',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 ring-amber-200',
  },
  {
    label: '코드 작성',
    subtitle: 'Code Gen',
    icon: Code,
    prompt: 'Python으로 웹 스크래퍼를 만들어줘. BeautifulSoup과 requests를 사용해서',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 ring-blue-200',
  },
  {
    label: '글쓰기 도우미',
    subtitle: 'Writing',
    icon: FileText,
    prompt: '블로그 포스트 초안을 작성해줘. 주제는 "AI의 미래"',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 ring-emerald-200',
  },
  {
    label: '번역하기',
    subtitle: 'Translate',
    icon: Languages,
    prompt: '이 한국어 문장을 자연스러운 영어로 번역해줘',
    iconColor: 'text-pink-600',
    iconBg: 'bg-pink-50 ring-pink-200',
  },
  {
    label: '이미지 분석',
    subtitle: 'Vision',
    icon: ImageIcon,
    prompt: '이미지를 업로드하면 어떤 내용인지 자세히 분석해줘',
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50 ring-violet-200',
  },
  {
    label: '데이터 분석',
    subtitle: 'Data',
    icon: BarChart3,
    prompt: 'CSV 데이터를 분석하고 주요 인사이트를 요약해줘',
    iconColor: 'text-slate-600',
    iconBg: 'bg-slate-100 ring-slate-200',
  },
  {
    label: '리서치',
    subtitle: 'Research',
    icon: Sparkles,
    prompt: '최신 AI 트렌드를 조사하고 핵심 포인트를 정리해줘',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50 ring-orange-200',
  },
  {
    label: '학습 도우미',
    subtitle: 'Learning',
    icon: BookOpen,
    prompt: '머신러닝의 기초 개념을 초보자도 이해할 수 있게 설명해줘',
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50 ring-teal-200',
  },
  {
    label: '디자인',
    subtitle: 'Design',
    icon: Palette,
    prompt: '웹사이트 UI/UX 디자인 아이디어를 제안해줘. 모던한 스타일로',
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50 ring-rose-200',
  },
  {
    label: '비즈니스',
    subtitle: 'Business',
    icon: Briefcase,
    prompt: '스타트업 피치덱을 만들기 위한 핵심 슬라이드 구조를 제안해줘',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 ring-indigo-200',
  },
];

interface SamplePromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

export function SamplePrompts({ onSelectPrompt }: SamplePromptsProps) {
  const selectedModelId = useModelStore((s) => s.selectedModelIds[0]);
  const modelConfig = selectedModelId ? getModelConfig(selectedModelId) : undefined;

  return (
    <div className="flex flex-col items-center justify-start h-full overflow-y-auto px-6 py-10 md:py-16">
      <div className="w-full max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-900 dark:bg-white shadow-md mb-5">
            <span className="text-white dark:text-gray-900 font-bold text-xl">AI</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white tracking-tight mb-3">
            무엇을 도와드릴까요?
          </h1>

          <p className="text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            템플릿을 선택하거나 직접 메시지를 입력해보세요
          </p>

          {modelConfig && (
            <div className="mt-5 inline-flex">
              <Badge variant="gray" size="md" dot>
                <span className="text-gray-700 dark:text-gray-300">
                  {modelConfig.displayName}
                </span>
              </Badge>
            </div>
          )}
        </div>

        {/* Templates */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            템플릿
          </p>
          <span className="text-xs text-gray-400">{templates.length}개</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {templates.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => onSelectPrompt(t.prompt)}
              aria-label={`${t.label} 템플릿 사용하기`}
              className="group text-left p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-500/12"
            >
              <div
                className={`inline-flex w-9 h-9 rounded-lg items-center justify-center ring-1 ring-inset ${t.iconBg} dark:bg-opacity-10 mb-3`}
              >
                <t.icon className={`w-4.5 h-4.5 ${t.iconColor}`} />
              </div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-0.5">
                {t.subtitle}
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                {t.label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
