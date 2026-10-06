/**
 * retry.ts
 * Retry with exponential backoff — for TRANSIENT failures only.
 *
 * Retrying a request that can never succeed (bad key, open circuit, invalid
 * request) only burns minutes: a CircuitOpenError used to be retried 49 times
 * in a single backfill run. The default policy (`isRetryableError`) therefore
 * retries network errors, timeouts, 408/409/429 and 5xx, and nothing else.
 */

import { CircuitOpenError } from './circuit-breaker';

export interface RetryOptions {
  maxRetries?: number;   // retries AFTER the first attempt (default 3 → up to 4 attempts)
  baseDelay?: number;    // default 1000ms
  maxDelay?: number;     // default 10000ms
  /** Decide whether an error is worth another attempt (default: isRetryableError). */
  shouldRetry?: (err: unknown) => boolean;
  /** Log prefix */
  label?: string;
}

/** HTTP status carried by an error (OpenAI SDK APIError has `.status`). */
export function getErrorStatus(err: unknown): number | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  const status = (err as { status?: unknown }).status;
  return typeof status === 'number' && Number.isInteger(status) ? status : undefined;
}

const RETRYABLE_ERROR_NAMES = new Set([
  'APIConnectionError',
  'APIConnectionTimeoutError',
  'AbortError',
  'TimeoutError',
  'FetchError',
]);

const RETRYABLE_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ECONNABORTED',
  'ETIMEDOUT',
  'EPIPE',
  'EAI_AGAIN',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
]);

const RETRYABLE_MESSAGE_RE = /fetch failed|socket hang up|network error|connection (?:error|reset|refused)|timed? ?out/i;

/**
 * Default retry policy.
 *  - CircuitOpenError → never (the breaker already decided the API is down)
 *  - HTTP status present → only 408 / 409 / 429 / 5xx (400/401/403/404/422 are permanent)
 *  - no status: network / timeout errors → yes; anything else (programming
 *    errors, parse errors) → no
 */
export function isRetryableError(err: unknown): boolean {
  if (err instanceof CircuitOpenError) return false;
  if (typeof err !== 'object' || err === null) return false;
  const e = err as { name?: unknown; code?: unknown; message?: unknown; cause?: unknown };
  if (e.name === 'CircuitOpenError') return false;

  const status = getErrorStatus(err);
  if (status !== undefined) {
    return status === 408 || status === 409 || status === 429 || status >= 500;
  }

  if (typeof e.name === 'string' && RETRYABLE_ERROR_NAMES.has(e.name)) return true;
  if (typeof e.code === 'string' && RETRYABLE_ERROR_CODES.has(e.code)) return true;
  if (typeof e.message === 'string' && RETRYABLE_MESSAGE_RE.test(e.message)) return true;
  // undici wraps the real socket error in `cause`
  if (e.cause && e.cause !== err) return isRetryableError(e.cause);
  return false;
}

/**
 * Executes `fn` and retries retryable failures with exponential backoff.
 * Delay = min(baseDelay * 2^n, maxDelay) + up to 10% jitter.
 * Throws the last error when it is not retryable or attempts are exhausted.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelay = options?.baseDelay ?? 1000;
  const maxDelay = options?.maxDelay ?? 10000;
  const shouldRetry = options?.shouldRetry ?? isRetryableError;
  const label = options?.label ?? 'retry';
  const maxAttempts = maxRetries + 1;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts || !shouldRetry(err)) break;

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      const jitter = Math.random() * delay * 0.1; // 10% jitter
      const waitMs = Math.round(delay + jitter);
      const msg = err instanceof Error ? err.message : String(err);

      console.warn(
        `[${label}] Attempt ${attempt}/${maxAttempts} failed (${msg.slice(0, 120)}), retrying in ${waitMs}ms…`,
      );

      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  throw lastError;
}
