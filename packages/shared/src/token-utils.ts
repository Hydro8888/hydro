import type { ModelPricing } from './models';

export function calculateCost(
  pricing: ModelPricing,
  inputTokens: number,
  outputTokens: number
): number {
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerMillionTokens;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillionTokens;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}

export function formatCost(costUsd: number): string {
  if (costUsd < 0.01) {
    return `$${costUsd.toFixed(4)}`;
  }
  return `$${costUsd.toFixed(2)}`;
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
