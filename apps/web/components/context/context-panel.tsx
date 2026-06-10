'use client';

import { useUIStore } from '@/stores/ui-store';
import { useModelStore } from '@/stores/model-store';
import { useUsage } from '@/hooks/use-usage';
import { getModelConfig, formatTokenCount } from '@ai-portal/shared';
import { TokenCounter } from './token-counter';
import { CostDisplay } from './cost-display';
import { Zap, DollarSign, Image, Wrench } from 'lucide-react';

export function ContextPanel() {
  const contextPanelOpen = useUIStore((s) => s.contextPanelOpen);
  const selectedModelIds = useModelStore((s) => s.selectedModelIds);
  const { data: usage } = useUsage();

  if (!contextPanelOpen) return null;

  const primaryModel = selectedModelIds[0]
    ? getModelConfig(selectedModelIds[0])
    : undefined;

  const totalTokens = usage?.currentPeriod.totalTokens ?? 0;
  const totalCost = usage?.currentPeriod.totalCost ?? 0;
  const limit = usage?.currentPeriod.limit ?? 50000;
  const byModelRaw = usage?.currentPeriod.byModel ?? [];
  const byModel = byModelRaw.map((r) => {
    const cfg = getModelConfig(r.modelId);
    return {
      modelId: r.modelId,
      modelName: cfg?.displayName ?? r.modelId,
      color: cfg?.color ?? '#6366F1',
      cost: r.cost,
    };
  });

  // Display total tokens (actual input/output breakdown not available from aggregated usage API)
  const inputTokens = totalTokens;
  const outputTokens = 0;

  return (
    <aside className="hidden md:flex w-72 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex-col shrink-0 overflow-y-auto">
      <div className="p-4 space-y-6">
        <TokenCounter
          inputTokens={inputTokens}
          outputTokens={outputTokens}
          limit={limit}
        />

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          <CostDisplay costs={byModel} />
          {totalCost > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              총 비용: ${totalCost.toFixed(4)}
            </p>
          )}
        </div>

        {primaryModel && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <h3 className="text-xs font-medium text-gray-500 mb-3">
              현재 모델 정보
            </h3>
            <div
              className="p-3 rounded-xl border"
              style={{ borderColor: `${primaryModel.color}30` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: primaryModel.color }}
                >
                  {primaryModel.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {primaryModel.displayName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {primaryModel.provider}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Zap className="w-3 h-3" /> 컨텍스트
                  </span>
                  <span className="font-medium">
                    {formatTokenCount(primaryModel.maxContextTokens)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-gray-500">
                    <DollarSign className="w-3 h-3" /> Input
                  </span>
                  <span className="font-medium">
                    ${primaryModel.pricing.inputPerMillionTokens}/M
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-gray-500">
                    <DollarSign className="w-3 h-3" /> Output
                  </span>
                  <span className="font-medium">
                    ${primaryModel.pricing.outputPerMillionTokens}/M
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Image className="w-3 h-3" /> 이미지
                  </span>
                  <span className="font-medium">
                    {primaryModel.supportsImages ? 'O' : 'X'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Wrench className="w-3 h-3" /> 함수 호출
                  </span>
                  <span className="font-medium">
                    {primaryModel.supportsFunctionCalling ? 'O' : 'X'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          <h3 className="text-xs font-medium text-gray-500 mb-3">설정</h3>
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex items-center justify-between">
              <span>스트리밍</span>
              <span className="text-green-500 font-medium">활성</span>
            </div>
            <div className="flex items-center justify-between">
              <span>자동 저장</span>
              <span className="text-green-500 font-medium">활성</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
