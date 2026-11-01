/**
 * Unit tests for src/lib/ai-client.ts (OpenAI). Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_AI_BASE_URL,
  DEFAULT_TEXT_MODEL,
  REASONING_HEADROOM_TOKENS,
  buildChatParams,
  chatCompletion,
  createAiClient,
  describeAiEndpoint,
  getAiConfig,
  isBillingError,
  isImageGenerationEnabled,
  newApiStats,
  resetAdaptiveParams,
  resolveImageModel,
  resolveReasoningEffort,
  resolveTextModel,
  unsupportedParamOf,
  type ChatClient,
} from '../src/lib/ai-client';

test('getAiConfig: no key → null', () => {
  assert.equal(getAiConfig({}), null);
  assert.equal(getAiConfig({ OPENAI_API_KEY: '   ' }), null);
  assert.equal(createAiClient('text', {}), null);
  // The old xAI key is no longer used
  assert.equal(getAiConfig({ XAI_API_KEY: 'xai-123' }), null);
});

test('getAiConfig: defaults (OpenAI base URL, timeouts, SDK retries off)', () => {
  assert.deepEqual(getAiConfig({ OPENAI_API_KEY: 'k' }), {
    apiKey: 'k',
    baseURL: DEFAULT_AI_BASE_URL,
    timeoutMs: 60000,
    maxRetries: 0,
  });
  assert.equal(DEFAULT_AI_BASE_URL, 'https://api.openai.com/v1');
  assert.equal(getAiConfig({ OPENAI_API_KEY: 'k' }, 'image')!.timeoutMs, 120000);
});

test('getAiConfig: base URL override, trailing slashes removed, invalid → default', () => {
  const cfg = (url: string | undefined) => getAiConfig({ OPENAI_API_KEY: 'k', OPENAI_BASE_URL: url })!.baseURL;
  assert.equal(cfg('http://127.0.0.1:4010/v1'), 'http://127.0.0.1:4010/v1');
  assert.equal(cfg(' http://127.0.0.1:4010/v1/// '), 'http://127.0.0.1:4010/v1');
  assert.equal(cfg(''), DEFAULT_AI_BASE_URL);
  assert.equal(cfg('not a url'), DEFAULT_AI_BASE_URL);
  assert.equal(cfg('ftp://example.com/v1'), DEFAULT_AI_BASE_URL);
  assert.equal(cfg(undefined), DEFAULT_AI_BASE_URL);
});

test('getAiConfig: timeout parsing (1000..600000, else default)', () => {
  const t = (v: string, kind: 'text' | 'image' = 'text') =>
    getAiConfig({ OPENAI_API_KEY: 'k', OPENAI_TIMEOUT_MS: v }, kind)!.timeoutMs;
  assert.equal(t('2000'), 2000);
  assert.equal(t('600000'), 600000);
  assert.equal(t('999'), 60000);
  assert.equal(t('600001'), 60000);
  assert.equal(t('abc'), 60000);
  assert.equal(t('1e4'), 60000);
  assert.equal(t('-5000', 'image'), 120000);
});

test('createAiClient applies the config to the SDK client', () => {
  const c = createAiClient('text', { OPENAI_API_KEY: 'k', OPENAI_BASE_URL: 'http://127.0.0.1:4010/v1', OPENAI_TIMEOUT_MS: '2000' })!;
  assert.equal(c.baseURL, 'http://127.0.0.1:4010/v1');
  assert.equal(c.timeout, 2000);
  assert.equal(c.maxRetries, 0);
});

test('describeAiEndpoint shows only the origin, never the key', () => {
  const env = { OPENAI_API_KEY: 'sk-secret-key', OPENAI_BASE_URL: 'http://127.0.0.1:4010/v1' };
  assert.equal(describeAiEndpoint(env), 'http://127.0.0.1:4010');
  assert.equal(describeAiEndpoint({}), 'https://api.openai.com');
  assert.ok(!describeAiEndpoint(env).includes('secret'));
});

test('models: gpt-6.1-terra by default, overridable; image generation opt-in', () => {
  assert.equal(DEFAULT_TEXT_MODEL, 'gpt-6.1-terra');
  assert.equal(resolveTextModel({}), 'gpt-6.1-terra');
  assert.equal(resolveTextModel({ OPENAI_MODEL: ' gpt-6.1-sol ' }), 'gpt-6.1-sol');
  assert.equal(resolveImageModel({}), 'gpt-image-2.5-flare');
  assert.equal(isImageGenerationEnabled({}), false);
  assert.equal(isImageGenerationEnabled({ OPENAI_IMAGE_GENERATION: 'TRUE' }), true);
  assert.equal(isImageGenerationEnabled({ OPENAI_IMAGE_GENERATION: '1' }), false);
});

test('resolveReasoningEffort: none by default, valid values kept, default → omitted', () => {
  assert.equal(resolveReasoningEffort({}), 'none');
  assert.equal(resolveReasoningEffort({ OPENAI_REASONING_EFFORT: 'LOW' }), 'low');
  assert.equal(resolveReasoningEffort({ OPENAI_REASONING_EFFORT: 'max' }), 'max');
  assert.equal(resolveReasoningEffort({ OPENAI_REASONING_EFFORT: 'turbo' }), 'none');
  assert.equal(resolveReasoningEffort({ OPENAI_REASONING_EFFORT: 'default' }), undefined);
});

test('buildChatParams: max_tokens → max_completion_tokens, reasoning_effort none keeps temperature', () => {
  const out = buildChatParams({ model: 'm', max_tokens: 4000, temperature: 0.3, messages: [] }, {}, new Set());
  assert.deepEqual(out, { model: 'm', max_completion_tokens: 4000, temperature: 0.3, messages: [], reasoning_effort: 'none' });
});

test('buildChatParams: reasoning effort other than none drops sampling params and adds headroom', () => {
  const out = buildChatParams(
    { model: 'm', max_tokens: 4000, temperature: 0.3, top_p: 0.9 },
    { OPENAI_REASONING_EFFORT: 'low' },
    new Set(),
  );
  assert.deepEqual(out, { model: 'm', max_completion_tokens: 4000 + REASONING_HEADROOM_TOKENS, reasoning_effort: 'low' });
  const omitted = buildChatParams({ model: 'm', max_tokens: 10 }, { OPENAI_REASONING_EFFORT: 'default' }, new Set());
  assert.deepEqual(omitted, { model: 'm', max_completion_tokens: 10 });
});

test('buildChatParams: applies parameters the model already rejected', () => {
  const base = { model: 'm', max_tokens: 100, temperature: 0.2 };
  assert.deepEqual(buildChatParams(base, {}, new Set(['max_completion_tokens'])), {
    model: 'm', max_tokens: 100, temperature: 0.2, reasoning_effort: 'none',
  });
  assert.deepEqual(buildChatParams(base, {}, new Set(['temperature', 'reasoning_effort'])), {
    model: 'm', max_completion_tokens: 100,
  });
  assert.deepEqual(buildChatParams(base, {}, new Set(['max_tokens', 'max_completion_tokens'])), {
    model: 'm', temperature: 0.2, reasoning_effort: 'none',
  });
});

function apiError(status: number, message: string, extra: Record<string, unknown> = {}) {
  return Object.assign(new Error(message), { status, ...extra });
}

test('unsupportedParamOf: OpenAI unsupported parameter / value errors', () => {
  assert.equal(
    unsupportedParamOf(apiError(400, "400 Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.", { param: 'max_tokens', code: 'unsupported_parameter' })),
    'max_tokens',
  );
  assert.equal(
    unsupportedParamOf(apiError(400, "400 Unsupported value: 'temperature' does not support 0.2 with this model. Only the default (1) value is supported.", { code: 'unsupported_value' })),
    'temperature',
  );
  assert.equal(unsupportedParamOf(apiError(400, '400 Unrecognized request argument supplied: reasoning_effort')), 'reasoning_effort');
  // Not adaptable / not a parameter problem
  assert.equal(unsupportedParamOf(apiError(400, "400 Unsupported parameter: 'messages'", { param: 'messages', code: 'unsupported_parameter' })), null);
  assert.equal(unsupportedParamOf(apiError(400, '400 Invalid JSON body')), null);
  assert.equal(unsupportedParamOf(apiError(401, "401 Unsupported parameter: 'temperature'")), null);
});

test('chatCompletion adapts once per model and remembers it (no breaker failure)', async () => {
  resetAdaptiveParams();
  const sent: Array<Record<string, unknown>> = [];
  const client: ChatClient = {
    chat: {
      completions: {
        async create(p: Record<string, unknown>) {
          sent.push(p);
          if ('temperature' in p) {
            throw apiError(400, "400 Unsupported value: 'temperature' does not support 0.2 with this model.", { param: 'temperature', code: 'unsupported_value' });
          }
          return { choices: [{ message: { content: '안녕' }, finish_reason: 'stop' }] };
        },
      },
    },
  };
  const stats = newApiStats();
  const params = { model: 'adapt-test', max_tokens: 50, temperature: 0.2, messages: [] };
  const r1 = await chatCompletion(client, params, stats);
  assert.equal(r1.content, '안녕');
  assert.equal(sent.length, 2);
  assert.equal('temperature' in sent[1], false);
  assert.equal(sent[1].max_completion_tokens, 50);
  // Second call goes straight through without the rejected parameter
  await chatCompletion(client, params, stats);
  assert.equal(sent.length, 3);
  assert.equal('temperature' in sent[2], false);
  assert.deepEqual({ calls: stats.apiCalls, failures: stats.apiFailures }, { calls: 2, failures: 0 });
  resetAdaptiveParams();
});

test('isBillingError: OpenAI insufficient_quota and other credit refusals; never retried', async () => {
  const { isRetryableError } = await import('../src/lib/retry');
  const openai429 = apiError(429, '429 You exceeded your current quota, please check your plan and billing details.', { code: 'insufficient_quota' });
  assert.equal(isBillingError(openai429), true);
  assert.equal(isRetryableError(openai429), false);
  const rateLimit = apiError(429, '429 Rate limit reached for requests', { code: 'rate_limit_exceeded' });
  assert.equal(isBillingError(rateLimit), false);
  assert.equal(isRetryableError(rateLimit), true);
  assert.equal(isBillingError(apiError(402, 'Payment Required')), true);
  assert.equal(isBillingError(apiError(403, '403 "Your team x has either used all available credits or reached its monthly spending limit."')), true);
  assert.equal(isBillingError(apiError(401, '401 Incorrect API key provided')), false);
  assert.equal(isBillingError(apiError(503, '503 upstream unavailable')), false);
  assert.equal(isBillingError(new Error('Circuit OPEN — 300s until half-open probe')), false);
});
