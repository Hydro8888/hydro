import type { LanguageModel } from 'ai';

export interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
}

export interface ProviderRegistry {
  getModel(modelId: string): LanguageModel;
  isAvailable(modelId: string): boolean;
}
