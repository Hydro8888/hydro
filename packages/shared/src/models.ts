export type ProviderKey =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'xai'
  | 'meta'
  | 'cohere'
  | 'mistral'
  | 'amazon'
  | 'ai21'
  | 'perplexity';

export interface ModelPricing {
  inputPerMillionTokens: number;
  outputPerMillionTokens: number;
}

export interface ModelConfig {
  id: string;
  provider: ProviderKey;
  displayName: string;
  description: string;
  maxContextTokens: number;
  pricing: ModelPricing;
  color: string;
  icon: string;
  supportsStreaming: boolean;
  supportsImages: boolean;
  supportsFunctionCalling: boolean;
  tier: 'free' | 'pro';
  tags: string[];
}

export const MODEL_CATALOG: ModelConfig[] = [
  {
    id: 'openai/gpt-5.2-pro',
    provider: 'openai',
    displayName: 'GPT-5.2 Pro',
    description: '최고 성능의 복잡 추론 모델',
    maxContextTokens: 128_000,
    pricing: { inputPerMillionTokens: 21, outputPerMillionTokens: 168 },
    color: '#10A37F',
    icon: '/models/openai.svg',
    supportsStreaming: true,
    supportsImages: true,
    supportsFunctionCalling: true,
    tier: 'pro',
    tags: ['popular', 'reasoning'],
  },
  {
    id: 'anthropic/claude-opus-4.6',
    provider: 'anthropic',
    displayName: 'Claude Opus 4.6',
    description: '긴 문서 분석, 안전성 최고',
    maxContextTokens: 200_000,
    pricing: { inputPerMillionTokens: 5, outputPerMillionTokens: 25 },
    color: '#CC785C',
    icon: '/models/anthropic.svg',
    supportsStreaming: true,
    supportsImages: true,
    supportsFunctionCalling: true,
    tier: 'pro',
    tags: ['popular', 'long-context'],
  },
  {
    id: 'google/gemini-2.5-pro',
    provider: 'google',
    displayName: 'Gemini 2.5 Pro',
    description: '멀티모달, 대용량 컨텍스트',
    maxContextTokens: 2_000_000,
    pricing: { inputPerMillionTokens: 1.25, outputPerMillionTokens: 10 },
    color: '#4285F4',
    icon: '/models/google.svg',
    supportsStreaming: true,
    supportsImages: true,
    supportsFunctionCalling: true,
    tier: 'free',
    tags: ['popular', 'multimodal', 'long-context'],
  },
  {
    id: 'xai/grok-4',
    provider: 'xai',
    displayName: 'Grok 4',
    description: '실시간 검색, X 플랫폼 통합',
    maxContextTokens: 256_000,
    pricing: { inputPerMillionTokens: 3, outputPerMillionTokens: 15 },
    color: '#1DA1F2',
    icon: '/models/xai.svg',
    supportsStreaming: true,
    supportsImages: false,
    supportsFunctionCalling: true,
    tier: 'pro',
    tags: ['realtime', 'search'],
  },
  {
    id: 'meta/llama-3.1-405b',
    provider: 'meta',
    displayName: 'Llama 3.1 405B',
    description: '오픈소스 최강, 커스터마이징 가능',
    maxContextTokens: 128_000,
    pricing: { inputPerMillionTokens: 5.33, outputPerMillionTokens: 16 },
    color: '#0668E1',
    icon: '/models/meta.svg',
    supportsStreaming: true,
    supportsImages: false,
    supportsFunctionCalling: true,
    tier: 'pro',
    tags: ['opensource'],
  },
  {
    id: 'cohere/command-r-plus',
    provider: 'cohere',
    displayName: 'Command R+',
    description: 'RAG 특화, 엔터프라이즈 검색',
    maxContextTokens: 128_000,
    pricing: { inputPerMillionTokens: 2.5, outputPerMillionTokens: 10 },
    color: '#D4AF37',
    icon: '/models/cohere.svg',
    supportsStreaming: true,
    supportsImages: false,
    supportsFunctionCalling: true,
    tier: 'pro',
    tags: ['rag', 'enterprise'],
  },
  {
    id: 'mistral/mistral-large',
    provider: 'mistral',
    displayName: 'Mistral Large',
    description: '유럽 AI, 다국어 지원 우수',
    maxContextTokens: 128_000,
    pricing: { inputPerMillionTokens: 2, outputPerMillionTokens: 6 },
    color: '#FD6E00',
    icon: '/models/mistral.svg',
    supportsStreaming: true,
    supportsImages: false,
    supportsFunctionCalling: true,
    tier: 'pro',
    tags: ['multilingual', 'economy'],
  },
  {
    id: 'ai21/jamba-large',
    provider: 'ai21',
    displayName: 'Jamba Large',
    description: '롱컨텍스트, 법률/문서 특화',
    maxContextTokens: 256_000,
    pricing: { inputPerMillionTokens: 2, outputPerMillionTokens: 8 },
    color: '#7B68EE',
    icon: '/models/ai21.svg',
    supportsStreaming: true,
    supportsImages: false,
    supportsFunctionCalling: false,
    tier: 'pro',
    tags: ['long-context', 'legal', 'economy'],
  },
  {
    id: 'perplexity/sonar-pro',
    provider: 'perplexity',
    displayName: 'Sonar Pro',
    description: '검색 증강 생성, 실시간 인용',
    maxContextTokens: 200_000,
    pricing: { inputPerMillionTokens: 3, outputPerMillionTokens: 15 },
    color: '#1FB8CD',
    icon: '/models/perplexity.svg',
    supportsStreaming: true,
    supportsImages: false,
    supportsFunctionCalling: false,
    tier: 'pro',
    tags: ['search', 'citation'],
  },
];

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODEL_CATALOG.find((m) => m.id === modelId);
}

export function getModelsByProvider(provider: ProviderKey): ModelConfig[] {
  return MODEL_CATALOG.filter((m) => m.provider === provider);
}

export function getFreeModels(): ModelConfig[] {
  return MODEL_CATALOG.filter((m) => m.tier === 'free');
}
