/**
 * xai-client.ts
 * One place that builds the xAI (OpenAI-compatible) client for every worker.
 *
 *  - XAI_BASE_URL     → point the whole pipeline at a proxy / mock server
 *                        (default https://api.x.ai/v1)
 *  - XAI_TIMEOUT_MS   → per-request timeout (default text 60s, image 120s)
 *  - SDK retries are OFF (maxRetries: 0). Retrying is done only by
 *    retryWithBackoff, so one request can never fan out into 3 × 3 attempts
 *    of 10 minutes each (the SDK default).
 *
 * Relative imports only — the tsx worker runtime has no `@/` alias.
 */

import OpenAI from 'openai';
import { xaiTextBreaker } from './circuit-breaker';
import { retryWithBackoff } from './retry';

export type XaiKind = 'text' | 'image';

export const DEFAULT_XAI_BASE_URL = 'https://api.x.ai/v1';
export const DEFAULT_XAI_TIMEOUT_MS: Record<XaiKind, number> = { text: 60_000, image: 120_000 };
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 600_000;

export interface XaiConfig {
  apiKey: string;
  baseURL: string;
  timeoutMs: number;
  maxRetries: 0;
}

type Env = Record<string, string | undefined>;

/** `XAI_BASE_URL` without trailing slashes; anything that is not an http(s) URL → default. */
export function resolveXaiBaseURL(env: Env = process.env): string {
  const raw = env.XAI_BASE_URL?.trim().replace(/\/+$/, '');
  if (!raw) return DEFAULT_XAI_BASE_URL;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return DEFAULT_XAI_BASE_URL;
    return raw;
  } catch {
    return DEFAULT_XAI_BASE_URL;
  }
}

/** `XAI_TIMEOUT_MS` as an integer in 1000..600000, otherwise the per-kind default. */
export function resolveXaiTimeoutMs(env: Env = process.env, kind: XaiKind = 'text'): number {
  const raw = env.XAI_TIMEOUT_MS?.trim();
  if (raw && /^\d+$/.test(raw)) {
    const n = Number(raw);
    if (n >= MIN_TIMEOUT_MS && n <= MAX_TIMEOUT_MS) return n;
  }
  return DEFAULT_XAI_TIMEOUT_MS[kind];
}

/** Pure: everything needed to build a client, or null when no API key is configured. */
export function getXaiConfig(env: Env = process.env, kind: XaiKind = 'text'): XaiConfig | null {
  const apiKey = env.XAI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseURL: resolveXaiBaseURL(env),
    timeoutMs: resolveXaiTimeoutMs(env, kind),
    maxRetries: 0,
  };
}

export function createXaiClient(kind: XaiKind = 'text', env: Env = process.env): OpenAI | null {
  const cfg = getXaiConfig(env, kind);
  if (!cfg) return null;
  return new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    timeout: cfg.timeoutMs,
    maxRetries: cfg.maxRetries,
  });
}

/** Origin of the configured endpoint for logs / diagnostics (never includes the key). */
export function describeXaiEndpoint(env: Env = process.env): string {
  try {
    return new URL(resolveXaiBaseURL(env)).origin;
  } catch {
    return new URL(DEFAULT_XAI_BASE_URL).origin;
  }
}

// ---------------------------------------------------------------------------
// Chat call shared by the title and body translators
// ---------------------------------------------------------------------------

/** Minimal structural type so tests can inject a fake client. */
export interface ChatClient {
  chat: { completions: { create(params: any): Promise<any> } };
}

/** Per-run API accounting — lets the backfill CLI tell "API down" from "model refused". */
export interface ApiStats {
  apiCalls: number;
  apiFailures: number;
}

export function newApiStats(): ApiStats {
  return { apiCalls: 0, apiFailures: 0 };
}

export interface ChatResult {
  content: string;
  finishReason: string | null;
}

/**
 * One logical chat request: retry (transient errors only) around the circuit
 * breaker around the HTTP call. Interpreting the response (JSON, echo,
 * finish_reason) happens in the caller, OUTSIDE the breaker — a model output
 * problem must never open the circuit.
 * Throws when the request ultimately failed (HTTP error / timeout / circuit open).
 */
export async function chatCompletion(
  client: ChatClient,
  params: Record<string, unknown>,
  stats?: ApiStats,
  label = 'xai',
): Promise<ChatResult> {
  if (stats) stats.apiCalls++;
  try {
    const res = await retryWithBackoff(
      () => xaiTextBreaker.execute(() => client.chat.completions.create(params)),
      { maxRetries: 2, baseDelay: 1500, label },
    );
    const choice = res?.choices?.[0];
    return {
      content: typeof choice?.message?.content === 'string' ? choice.message.content : '',
      finishReason: typeof choice?.finish_reason === 'string' ? choice.finish_reason : null,
    };
  } catch (err) {
    if (stats) stats.apiFailures++;
    throw err;
  }
}
