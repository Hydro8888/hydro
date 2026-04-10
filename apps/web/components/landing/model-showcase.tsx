'use client';

import { MODEL_CATALOG } from '@ai-portal/shared';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { Zap, Image, Wrench } from 'lucide-react';

export function ModelShowcase() {
  return (
    <Section
      id="models"
      variant="white"
      eyebrow="Models"
      title="세계 최고의 AI, 한자리에"
      subtitle="9개 프리미엄 AI 제공사의 최신 모델을 만나보세요"
      containerSize="lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODEL_CATALOG.map((model) => (
          <div
            key={model.id}
            className="group relative p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: `${model.color}15` }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: model.color }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                    {model.displayName}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {model.provider}
                  </p>
                </div>
              </div>
              {model.tier === 'free' ? (
                <Badge variant="success" size="sm">Free</Badge>
              ) : (
                <Badge variant="primary" size="sm">Pro</Badge>
              )}
            </div>

            {/* Capability icons */}
            <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
              {model.supportsStreaming && (
                <span className="flex items-center gap-1 text-[11px]">
                  <Zap className="w-3 h-3" /> 스트리밍
                </span>
              )}
              {model.supportsImages && (
                <span className="flex items-center gap-1 text-[11px]">
                  <Image className="w-3 h-3" /> 이미지
                </span>
              )}
              {model.supportsFunctionCalling && (
                <span className="flex items-center gap-1 text-[11px]">
                  <Wrench className="w-3 h-3" /> 함수
                </span>
              )}
            </div>

            <div className="mt-3 flex justify-between text-[11px] text-gray-400">
              <span>Input ${model.pricing.inputPerMillionTokens}/M</span>
              <span>Output ${model.pricing.outputPerMillionTokens}/M</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
