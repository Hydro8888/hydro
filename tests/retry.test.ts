/**
 * Unit tests for src/lib/retry.ts + src/lib/circuit-breaker.ts (slice S5).
 * Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isRetryableError, retryWithBackoff } from '../src/lib/retry';
import { CircuitBreaker, CircuitOpenError } from '../src/lib/circuit-breaker';

const fastRetry = { maxRetries: 2, baseDelay: 1, maxDelay: 2 };
const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status });

async function countCalls(err: unknown, opts = fastRetry): Promise<number> {
  let calls = 0;
  await assert.rejects(
    retryWithBackoff(async () => {
      calls++;
      throw err;
    }, opts),
  );
  return calls;
}

test('isRetryableError: policy table', () => {
  assert.equal(isRetryableError(new CircuitOpenError()), false);
  for (const s of [400, 401, 403, 404, 422]) assert.equal(isRetryableError(httpError(s)), false, String(s));
  for (const s of [408, 409, 429, 500, 502, 503, 504]) assert.equal(isRetryableError(httpError(s)), true, String(s));
  const named = (name: string) => Object.assign(new Error('x'), { name });
  assert.equal(isRetryableError(named('APIConnectionError')), true);
  assert.equal(isRetryableError(named('APIConnectionTimeoutError')), true);
  assert.equal(isRetryableError(named('AbortError')), true);
  assert.equal(isRetryableError(Object.assign(new Error('read'), { code: 'ECONNRESET' })), true);
  assert.equal(isRetryableError(new TypeError('fetch failed')), true);
  assert.equal(isRetryableError(new SyntaxError('Unexpected token')), false);
  assert.equal(isRetryableError('boom'), false);
});

test('CircuitOpenError and 401 are tried exactly once', async () => {
  assert.equal(await countCalls(new CircuitOpenError()), 1);
  assert.equal(await countCalls(httpError(401)), 1);
  assert.equal(await countCalls(httpError(400)), 1);
});

test('503 / 429 / network errors are tried maxRetries + 1 times', async () => {
  assert.equal(await countCalls(httpError(503)), 3);
  assert.equal(await countCalls(httpError(429)), 3);
  assert.equal(await countCalls(Object.assign(new Error('socket'), { code: 'ECONNRESET' })), 3);
});

test('shouldRetry injection overrides the default policy', async () => {
  assert.equal(await countCalls(httpError(401), { ...fastRetry, shouldRetry: () => true } as any), 3);
  assert.equal(await countCalls(httpError(503), { ...fastRetry, shouldRetry: () => false } as any), 1);
});

test('success after transient failures returns the value', async () => {
  let calls = 0;
  const v = await retryWithBackoff(async () => {
    calls++;
    if (calls < 3) throw httpError(502);
    return 'ok';
  }, fastRetry);
  assert.equal(v, 'ok');
  assert.equal(calls, 3);
});

test('breaker: opens after threshold, HALF_OPEN lets exactly one probe through', async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 20 });
  const fail = () => Promise.reject(new Error('down'));
  await assert.rejects(breaker.execute(fail));
  await assert.rejects(breaker.execute(fail));
  assert.equal(breaker.getState().state, 'OPEN');
  await assert.rejects(breaker.execute(async () => 'x'), CircuitOpenError);

  await new Promise((r) => setTimeout(r, 30));
  let executed = 0;
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const probe = breaker.execute(async () => {
    executed++;
    await gate;
    return 'probe';
  });
  const second = breaker.execute(async () => {
    executed++;
    return 'second';
  });
  await assert.rejects(second, CircuitOpenError);
  release();
  assert.equal(await probe, 'probe');
  assert.equal(executed, 1);
  assert.equal(breaker.getState().state, 'CLOSED');
});

test('breaker + retry: an open circuit is not retried', async () => {
  const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeout: 60_000 });
  let calls = 0;
  await assert.rejects(
    retryWithBackoff(() => breaker.execute(async () => {
      calls++;
      throw httpError(503);
    }), fastRetry),
    CircuitOpenError,
  );
  assert.equal(calls, 1, 'first 503 opens the circuit, the retry hits CircuitOpenError and stops');
});
