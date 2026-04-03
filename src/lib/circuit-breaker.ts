/**
 * circuit-breaker.ts
 * Circuit breaker pattern for external API calls (e.g. xAI).
 * Prevents cascading failures by short-circuiting when an API is down.
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitOpenError extends Error {
  constructor(message?: string) {
    super(message ?? 'Circuit breaker is OPEN — requests are blocked');
    this.name = 'CircuitOpenError';
  }
}

interface CircuitBreakerOptions {
  failureThreshold?: number; // consecutive failures before opening (default 3)
  resetTimeout?: number;     // ms to wait before half-open probe (default 5 min)
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;

  constructor(options?: CircuitBreakerOptions) {
    this.failureThreshold = options?.failureThreshold ?? 3;
    this.resetTimeout = options?.resetTimeout ?? 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Execute `fn` through the circuit breaker.
   *
   * - CLOSED: execute normally; track consecutive failures.
   *   After failureThreshold consecutive failures → OPEN.
   * - OPEN: immediately throw CircuitOpenError if within resetTimeout.
   * - HALF_OPEN: after resetTimeout elapses, allow one probe execution.
   *   Success → CLOSED. Failure → OPEN again.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed < this.resetTimeout) {
        throw new CircuitOpenError(
          `Circuit OPEN — ${Math.ceil((this.resetTimeout - elapsed) / 1000)}s until half-open probe`,
        );
      }
      // Transition to HALF_OPEN for a single probe
      this.state = 'HALF_OPEN';
      console.log('[circuit-breaker] Transitioning to HALF_OPEN — attempting probe');
    }

    try {
      const result = await fn();
      // Success: reset to CLOSED
      if (this.state === 'HALF_OPEN' || this.failureCount > 0) {
        console.log('[circuit-breaker] Success — circuit CLOSED');
      }
      this.state = 'CLOSED';
      this.failureCount = 0;
      return result;
    } catch (err) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.state === 'HALF_OPEN') {
        // Probe failed — back to OPEN
        this.state = 'OPEN';
        console.warn('[circuit-breaker] Half-open probe failed — circuit OPEN again');
        throw err;
      }

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        console.warn(
          `[circuit-breaker] ${this.failureCount} consecutive failures — circuit OPEN`,
        );
      }

      throw err;
    }
  }

  getState(): { state: CircuitState; failureCount: number } {
    return { state: this.state, failureCount: this.failureCount };
  }
}

// ---------------------------------------------------------------------------
// Shared singleton instances — one per external API
// ---------------------------------------------------------------------------

/** Circuit breaker for xAI text API (translations, categorization) */
export const xaiTextBreaker = new CircuitBreaker({ failureThreshold: 3, resetTimeout: 5 * 60 * 1000 });

/** Circuit breaker for xAI image generation API */
export const xaiImageBreaker = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 10 * 60 * 1000 });
