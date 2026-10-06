/**
 * Unit tests for src/lib/xai-client.ts (slice S5). Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_XAI_BASE_URL,
  createXaiClient,
  describeXaiEndpoint,
  getXaiConfig,
} from '../src/lib/xai-client';

test('getXaiConfig: no key → null', () => {
  assert.equal(getXaiConfig({}), null);
  assert.equal(getXaiConfig({ XAI_API_KEY: '   ' }), null);
  assert.equal(createXaiClient('text', {}), null);
});

test('getXaiConfig: defaults (base URL, timeouts, SDK retries off)', () => {
  assert.deepEqual(getXaiConfig({ XAI_API_KEY: 'k' }), {
    apiKey: 'k',
    baseURL: DEFAULT_XAI_BASE_URL,
    timeoutMs: 60000,
    maxRetries: 0,
  });
  assert.equal(getXaiConfig({ XAI_API_KEY: 'k' }, 'image')!.timeoutMs, 120000);
});

test('getXaiConfig: base URL override, trailing slashes removed, invalid → default', () => {
  const cfg = (url: string | undefined) => getXaiConfig({ XAI_API_KEY: 'k', XAI_BASE_URL: url })!.baseURL;
  assert.equal(cfg('http://127.0.0.1:4010/v1'), 'http://127.0.0.1:4010/v1');
  assert.equal(cfg(' http://127.0.0.1:4010/v1/// '), 'http://127.0.0.1:4010/v1');
  assert.equal(cfg(''), DEFAULT_XAI_BASE_URL);
  assert.equal(cfg('not a url'), DEFAULT_XAI_BASE_URL);
  assert.equal(cfg('ftp://example.com/v1'), DEFAULT_XAI_BASE_URL);
  assert.equal(cfg(undefined), DEFAULT_XAI_BASE_URL);
});

test('getXaiConfig: timeout parsing (1000..600000, else default)', () => {
  const t = (v: string, kind: 'text' | 'image' = 'text') =>
    getXaiConfig({ XAI_API_KEY: 'k', XAI_TIMEOUT_MS: v }, kind)!.timeoutMs;
  assert.equal(t('2000'), 2000);
  assert.equal(t('600000'), 600000);
  assert.equal(t('999'), 60000);
  assert.equal(t('600001'), 60000);
  assert.equal(t('abc'), 60000);
  assert.equal(t('1e4'), 60000);
  assert.equal(t('-5000', 'image'), 120000);
});

test('createXaiClient applies the config to the SDK client', () => {
  const c = createXaiClient('text', { XAI_API_KEY: 'k', XAI_BASE_URL: 'http://127.0.0.1:4010/v1', XAI_TIMEOUT_MS: '2000' })!;
  assert.equal(c.baseURL, 'http://127.0.0.1:4010/v1');
  assert.equal(c.timeout, 2000);
  assert.equal(c.maxRetries, 0);
});

test('describeXaiEndpoint shows only the origin, never the key', () => {
  const env = { XAI_API_KEY: 'secret-key', XAI_BASE_URL: 'http://127.0.0.1:4010/v1' };
  assert.equal(describeXaiEndpoint(env), 'http://127.0.0.1:4010');
  assert.equal(describeXaiEndpoint({}), 'https://api.x.ai');
  assert.ok(!describeXaiEndpoint(env).includes('secret'));
});

test('isBillingError: credits / spending-limit refusals are recognised', async () => {
  const { isBillingError } = await import('../src/lib/xai-client');
  const xai403 = Object.assign(
    new Error('403 "Your team x has either used all available credits or reached its monthly spending limit."'),
    { status: 403 },
  );
  assert.equal(isBillingError(xai403), true);
  assert.equal(isBillingError(Object.assign(new Error('Payment Required'), { status: 402 })), true);
  assert.equal(isBillingError(Object.assign(new Error('429 insufficient_quota'), { status: 429 })), true);
  assert.equal(isBillingError(Object.assign(new Error('401 Incorrect API key'), { status: 401 })), false);
  assert.equal(isBillingError(Object.assign(new Error('503 upstream unavailable'), { status: 503 })), false);
  assert.equal(isBillingError(new Error('Circuit OPEN — 300s until half-open probe')), false);
});
