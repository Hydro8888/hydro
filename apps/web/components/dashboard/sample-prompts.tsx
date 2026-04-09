'use client';

import { Lightbulb, Code, FileText, Languages } from 'lucide-react';
import { useModelStore } from '@/stores/model-store';
import { getModelConfig } from '@ai-portal/shared';

const prompts = [
  { icon: Lightbulb, label: '아이디어 브레인스토밍', text: '새로운 비즈니스 아이디어를 5개 제안해줘', color: 'text-amber-500' },
  { icon: Code, label: '코드 작성', text: 'Python으로 간단한 웹 스크래퍼를 만들어줘', color: 'text-blue-500' },
  { icon: FileText, label: '글쓰기 도우미', text: '블로그 포스트 초안을 작성해줘', color: 'text-green-500' },
  { icon: Languages, label: '번역하기', text: '이 텍스트를 영어로 번역해줘', color: 'text-purple-500' },
];

interface SamplePromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

export function SamplePrompts({ onSelectPrompt }: SamplePromptsProps) {
  const selectedModelId = useModelStore((s) => s.selectedModelIds[0]);
  const modelConfig = selectedModelId ? getModelConfig(selectedModelId) : undefined;

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-lg w-full px-4">
        <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-xl font-bold text-primary-500">AI</span>
        </div>

        <h2 className="text-xl font-bold mb-1">무엇을 도와드릴까요?</h2>

        {modelConfig && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-6" style={{ backgroundColor: `${modelConfig.color}15`, color: modelConfig.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: modelConfig.color }} />
            {modelConfig.displayName}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {prompts.map((p) => (
            <button
              key={p.label}
              onClick={() => onSelectPrompt(p.text)}
              className="group text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all bg-white dark:bg-gray-900"
            >
              <p.icon className={`w-5 h-5 ${p.color} mb-2`} />
              <p className="text-sm font-medium mb-0.5">{p.label}</p>
              <p className="text-xs text-gray-400 line-clamp-1">{p.text}</p>
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-6">또는 직접 메시지를 입력하세요</p>
      </div>
    </div>
  );
}
