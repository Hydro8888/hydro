/**
 * retry.ts
 * Retry with exponential backoff for transient failures.
 */

export interface RetryOptions {
  maxRetries?: number;   // default 3
  baseDelay?: number;    // default 1000ms
  maxDelay?: number;     // default 10000ms
}

/**
 * Executes `fn` and retries on failure with exponential backoff.
 * Delay = min(baseDelay * 2^attempt, maxDelay) + small random jitter.
 * Throws the last error if all retries are exhausted.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelay = options?.baseDelay ?? 1000;
  const maxDelay = options?.maxDelay ?? 10000;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === maxRetries) {
        break;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * delay * 0.1; // 10% jitter
      const waitMs = Math.round(delay + jitter);

      console.warn(
        `[retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${waitMs}ms…`,
      );

      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  throw lastError;
}
