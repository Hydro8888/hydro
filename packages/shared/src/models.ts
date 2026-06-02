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
    id: 'openai/gpt-5.5',
    provider: 'openai',
    displayName: 'GPT-5.5',
    description: '최고 성능의 복잡 추론·코딩 플래그십',
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
    id: 'anthropic/claude-opus-4.8',
    provider: 'anthropic',
    displayName: 'Claude Opus 4.8',
    description: '긴 문서 분석·에이전트 코딩, 1M 컨텍스트',
    maxContextTokens: 1_000_000,
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
    id: 'google/gemini-3.5-flash',
    provider: 'google',
    displayName: 'Gemini 3.5 Flash',
    description: '프런티어급 지능, 빠른 멀티모달 처리',
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
    id: 'xai/grok-4.3',
    provider: 'xai',
    displayName: 'Grok 4.3',
    description: '실시간 검색, 최고 지능·속도의 최신 Grok',
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
    id: 'meta/llama-4-maverick',
    provider: 'meta',
    displayName: 'Llama 4 Maverick',
    description: '오픈웨이트 멀티모달 MoE, 대용량 컨텍스트',
    maxContextTokens: 1_000_000,
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
    id: 'cohere/command-a-plus',
    provider: 'cohere',
    displayName: 'Command A+',
    description: 'RAG·에이전트 특화 엔터프라이즈 MoE',
    maxContextTokens: 256_000,
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
    id: 'mistral/mistral-medium-3.5',
    provider: 'mistral',
    displayName: 'Mistral Medium 3.5',
    description: '유럽 AI, 추론·코딩 통합 플래그십',
    maxContextTokens: 256_000,
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
    displayName: 'Jamba Large 1.7',
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
