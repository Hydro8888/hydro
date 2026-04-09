'use client';

import { MODEL_CATALOG } from '@ai-portal/shared';
import { Zap, Image, Wrench } from 'lucide-react';

export function ModelShowcase() {
  return (
    <section id="models" className="py-20 md:py-28 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            세계 최고의 AI, 한자리에
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            9개 프리미엄 AI 제공사의 최신 모델을 만나보세요
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODEL_CATALOG.map((model) => (
            <div
              key={model.id}
              className="group relative p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default overflow-hidden"
            >
              {/* Left color accent */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                style={{ backgroundColor: model.color }}
              />

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: model.color }}
                  />
                  <h3 className="font-semibold text-sm">{model.displayName}</h3>
                </div>
                {model.tier === 'free' ? (
                  <span className="text-[10px] font-medium text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 px-2 py-0.5 rounded-full">
                    Free
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-primary-600 bg-primary-50 dark:bg-primary-950 dark:text-primary-400 px-2 py-0.5 rounded-full">
                    Pro
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-400 mb-3">{model.provider}</p>

              {/* Capability icons */}
              <div className="flex items-center gap-3 text-gray-400">
                {model.supportsStreaming && (
                  <span className="flex items-center gap-1 text-[10px]" title="스트리밍">
                    <Zap className="w-3 h-3" /> 스트리밍
                  </span>
                )}
                {model.supportsImages && (
                  <span className="flex items-center gap-1 text-[10px]" title="이미지">
                    <Image className="w-3 h-3" /> 이미지
                  </span>
                )}
                {model.supportsFunctionCalling && (
                  <span className="flex items-center gap-1 text-[10px]" title="함수 호출">
                    <Wrench className="w-3 h-3" /> 함수
                  </span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800 flex justify-between text-[10px] text-gray-400">
                <span>Input: ${model.pricing.inputPerMillionTokens}/M</span>
                <span>Output: ${model.pricing.outputPerMillionTokens}/M</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
