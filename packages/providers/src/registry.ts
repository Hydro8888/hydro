import type { LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createCohere } from '@ai-sdk/cohere';
import { MODEL_CATALOG } from '@ai-portal/shared';

function createProviders() {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? '',
  });

  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
  });

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '',
  });

  const xai = createOpenAI({
    apiKey: process.env.XAI_API_KEY ?? '',
    baseURL: 'https://api.x.ai/v1',
  });

  const together = createOpenAI({
    apiKey: process.env.TOGETHER_API_KEY ?? '',
    baseURL: 'https://api.together.xyz/v1',
  });

  const mistral = createMistral({
    apiKey: process.env.MISTRAL_API_KEY ?? '',
  });

  const cohere = createCohere({
    apiKey: process.env.COHERE_API_KEY ?? '',
  });

  const perplexity = createOpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY ?? '',
    baseURL: 'https://api.perplexity.ai',
  });

  const ai21 = createOpenAI({
    apiKey: process.env.AI21_API_KEY ?? '',
    baseURL: 'https://api.ai21.com/studio/v1',
  });

  const modelMap: Record<string, () => LanguageModel> = {
    'openai/gpt-5.2-pro': () => openai('gpt-5.2-pro'),
    'anthropic/claude-opus-4.6': () => anthropic('claude-opus-4-6'),
    'google/gemini-2.5-pro': () => google('gemini-2.5-pro'),
    'xai/grok-4': () => xai('grok-4'),
    'meta/llama-3.1-405b': () => together('meta-llama/Llama-3.1-405B-Instruct-Turbo'),
    'cohere/command-r-plus': () => cohere('command-r-plus'),
    'mistral/mistral-large': () => mistral('mistral-large-latest'),
    'ai21/jamba-large': () => ai21('jamba-1.5-large'),
    'perplexity/sonar-pro': () => perplexity('sonar-pro'),
  };

  return modelMap;
}

let providers: Record<string, () => LanguageModel> | null = null;

function getProviders() {
  if (!providers) {
    providers = createProviders();
  }
  return providers;
}

export function getModel(modelId: string): LanguageModel {
  const modelMap = getProviders();
  const factory = modelMap[modelId];
  if (!factory) {
    throw new Error(`Unknown model: ${modelId}. Available: ${Object.keys(modelMap).join(', ')}`);
  }
  return factory();
}

export function isModelAvailable(modelId: string): boolean {
  const modelMap = getProviders();
  return modelId in modelMap;
}

export function getAvailableModels() {
  return MODEL_CATALOG.filter((m) => isModelAvailable(m.id));
}
