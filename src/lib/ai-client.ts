/**
 * ai-client.ts
 * One place that builds the OpenAI client for every worker (translation,
 * categorization, image generation).
 *
 *  - OPENAI_API_KEY           → required (set it with `bash set-ai-key.sh`)
 *  - OPENAI_MODEL             → text model (default gpt-6.1-terra)
 *  - OPENAI_REASONING_EFFORT  → none (default) | low | medium | high | xhigh | max | default
 *                                `none` = no hidden reasoning tokens: translation needs none,
 *                                and they would eat the output budget and cost.
 *                                `default` = do not send the parameter (model default).
 *  - OPENAI_BASE_URL          → proxy / mock server (default https://api.openai.com/v1)
 *  - OPENAI_TIMEOUT_MS        → per-request timeout (default text 60s, image 120s)
 *  - SDK retries are OFF (maxRetries: 0). Retrying is done only by
 *    retryWithBackoff, so one request can never fan out into 3 × 3 attempts.
 *
 * Relative imports only — the tsx worker runtime has no `@/` alias.
 */

import OpenAI from 'openai';
import { aiTextBreaker, CircuitOpenError } from './circuit-breaker';
import { getErrorStatus, isBillingError, retryWithBackoff } from './retry';

export { isBillingError };

export type AiKind = 'text' | 'image';

export const DEFAULT_AI_BASE_URL = 'https://api.openai.com/v1';
export const DEFAULT_TEXT_MODEL = 'gpt-6.1-terra';
export const DEFAULT_IMAGE_MODEL = 'gpt-image-2.5-flare';
export const DEFAULT_AI_TIMEOUT_MS: Record<AiKind, number> = { text: 60_000, image: 120_000 };
const MIN_TIMEOUT_MS = 1_000;
const MAX_TIMEOUT_MS = 600_000;

export const REASONING_EFFORTS = ['none', 'low', 'medium', 'high', 'xhigh', 'max'] as const;
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];
/** Extra output budget when the model reasons: reasoning tokens count against max_completion_tokens. */
export const REASONING_HEADROOM_TOKENS = 8000;

export interface AiConfig {
  apiKey: string;
  baseURL: string;
  timeoutMs: number;
  maxRetries: 0;
}

type Env = Record<string, string | undefined>;

/** `OPENAI_BASE_URL` without trailing slashes; anything that is not an http(s) URL → default. */
export function resolveAiBaseURL(env: Env = process.env): string {
  const raw = env.OPENAI_BASE_URL?.trim().replace(/\/+$/, '');
  if (!raw) return DEFAULT_AI_BASE_URL;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return DEFAULT_AI_BASE_URL;
    return raw;
  } catch {
    return DEFAULT_AI_BASE_URL;
  }
}

/** `OPENAI_TIMEOUT_MS` as an integer in 1000..600000, otherwise the per-kind default. */
export function resolveAiTimeoutMs(env: Env = process.env, kind: AiKind = 'text'): number {
  const raw = env.OPENAI_TIMEOUT_MS?.trim();
  if (raw && /^\d+$/.test(raw)) {
    const n = Number(raw);
    if (n >= MIN_TIMEOUT_MS && n <= MAX_TIMEOUT_MS) return n;
  }
  return DEFAULT_AI_TIMEOUT_MS[kind];
}

export function resolveTextModel(env: Env = process.env): string {
  return env.OPENAI_MODEL?.trim() || DEFAULT_TEXT_MODEL;
}

export function resolveImageModel(env: Env = process.env): string {
  return env.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_IMAGE_MODEL;
}

/** Image generation costs money per article — it runs only when explicitly enabled. */
export function isImageGenerationEnabled(env: Env = process.env): boolean {
  return env.OPENAI_IMAGE_GENERATION?.trim().toLowerCase() === 'true';
}

/** undefined = do not send `reasoning_effort` at all. Unknown values fall back to 'none'. */
export function resolveReasoningEffort(env: Env = process.env): ReasoningEffort | undefined {
  const raw = env.OPENAI_REASONING_EFFORT?.trim().toLowerCase();
  if (!raw) return 'none';
  if (raw === 'default') return undefined;
  return (REASONING_EFFORTS as readonly string[]).includes(raw) ? (raw as ReasoningEffort) : 'none';
}

/** Pure: everything needed to build a client, or null when no API key is configured. */
export function getAiConfig(env: Env = process.env, kind: AiKind = 'text'): AiConfig | null {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseURL: resolveAiBaseURL(env),
    timeoutMs: resolveAiTimeoutMs(env, kind),
    maxRetries: 0,
  };
}

export function createAiClient(kind: AiKind = 'text', env: Env = process.env): OpenAI | null {
  const cfg = getAiConfig(env, kind);
  if (!cfg) return null;
  return new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    timeout: cfg.timeoutMs,
    maxRetries: cfg.maxRetries,
  });
}

/** Origin of the configured endpoint for logs / diagnostics (never includes the key). */
export function describeAiEndpoint(env: Env = process.env): string {
  try {
    return new URL(resolveAiBaseURL(env)).origin;
  } catch {
    return new URL(DEFAULT_AI_BASE_URL).origin;
  }
}

// ---------------------------------------------------------------------------
// Request parameters — current OpenAI models reject some classic parameters
// ---------------------------------------------------------------------------

/** Parameters a model may refuse that can be dropped or renamed without changing the request's meaning. */
const ADAPTABLE_PARAMS = new Set(['max_tokens', 'max_completion_tokens', 'temperature', 'top_p', 'reasoning_effort']);

/** Per model: parameters the API answered "unsupported" for (remembered for the process lifetime). */
const rejectedParams = new Map<string, Set<string>>();

/** Tests only. */
export function resetAdaptiveParams(): void {
  rejectedParams.clear();
}

function rejectedFor(model: string): Set<string> {
  let set = rejectedParams.get(model);
  if (!set) {
    set = new Set();
    rejectedParams.set(model, set);
  }
  return set;
}

/**
 * Turns the callers' classic request (`max_tokens`, `temperature`) into one the
 * configured model accepts:
 *  - `max_tokens` → `max_completion_tokens` (GPT-5 and later reject `max_tokens`)
 *  - adds `reasoning_effort` (default 'none'); with any other effort the sampling
 *    parameters are dropped and the output budget gets reasoning headroom
 *  - applies what the API already refused for this model in this process
 */
export function buildChatParams(
  params: Record<string, unknown>,
  env: Env = process.env,
  rejected: ReadonlySet<string> = rejectedParams.get(String(params.model ?? '')) ?? new Set(),
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...params };

  if (out.max_tokens !== undefined && out.max_completion_tokens === undefined) {
    out.max_completion_tokens = out.max_tokens;
    delete out.max_tokens;
  }

  const effort = resolveReasoningEffort(env);
  if (effort) out.reasoning_effort = effort;
  if (effort && effort !== 'none') {
    delete out.temperature;
    delete out.top_p;
    if (typeof out.max_completion_tokens === 'number') out.max_completion_tokens += REASONING_HEADROOM_TOKENS;
  }

  const noCompletion = rejected.has('max_completion_tokens');
  const noMax = rejected.has('max_tokens');
  if (noCompletion && noMax) {
    delete out.max_completion_tokens;
    delete out.max_tokens;
  } else if (noCompletion && out.max_completion_tokens !== undefined) {
    out.max_tokens = out.max_completion_tokens;
    delete out.max_completion_tokens;
  } else if (noMax && out.max_tokens !== undefined) {
    out.max_completion_tokens = out.max_tokens;
    delete out.max_tokens;
  }
  for (const p of ['temperature', 'top_p', 'reasoning_effort']) {
    if (rejected.has(p)) delete out[p];
  }
  return out;
}

/**
 * The parameter a 400 "unsupported parameter / value" error is about, when it is
 * one we can safely adapt; otherwise null (a real bad request).
 * OpenAI: `{ error: { param: 'max_tokens', code: 'unsupported_parameter', message: "Unsupported parameter: 'max_tokens' …" } }`.
 */
export function unsupportedParamOf(err: unknown): string | null {
  if (getErrorStatus(err) !== 400) return null;
  const e = err as { param?: unknown; code?: unknown; message?: unknown };
  const msg = typeof e.message === 'string' ? e.message : '';
  const looksUnsupported =
    e.code === 'unsupported_parameter' ||
    e.code === 'unsupported_value' ||
    /unsupported (?:parameter|value)|unrecognized request argument|not supported with this model|unknown parameter/i.test(msg);
  if (!looksUnsupported) return null;
  const param =
    (typeof e.param === 'string' && e.param) ||
    msg.match(/'([a-z_]+)'/i)?.[1] ||
    msg.match(/argument supplied: ([a-z_]+)/i)?.[1] ||
    '';
  return ADAPTABLE_PARAMS.has(param) ? param : null;
}

async function createAdaptive(client: ChatClient, params: Record<string, unknown>): Promise<any> {
  const model = String(params.model ?? '');
  for (let attempt = 0; ; attempt++) {
    const body = buildChatParams(params, process.env, rejectedFor(model));
    try {
      return await client.chat.completions.create(body);
    } catch (err) {
      const param = unsupportedParamOf(err);
      if (!param || attempt >= ADAPTABLE_PARAMS.size || rejectedFor(model).has(param)) throw err;
      rejectedFor(model).add(param);
      console.warn(`[ai] Model "${model}" does not accept '${param}' — adapting the request and retrying`);
    }
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
  /** Last failure message (no secrets — provider error text only). */
  lastError?: string;
  /** The provider refused because of credits / spending limit — retrying cannot help. */
  billingBlocked?: boolean;
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
 * breaker around the HTTP call (which adapts unsupported parameters in place).
 * Interpreting the response (JSON, echo, finish_reason) happens in the caller,
 * OUTSIDE the breaker — a model output problem must never open the circuit.
 * Throws when the request ultimately failed (HTTP error / timeout / circuit open).
 */
export async function chatCompletion(
  client: ChatClient,
  params: Record<string, unknown>,
  stats?: ApiStats,
  label = 'ai',
): Promise<ChatResult> {
  if (stats) stats.apiCalls++;
  try {
    const res = await retryWithBackoff(
      () => aiTextBreaker.execute(() => createAdaptive(client, params)),
      { maxRetries: 2, baseDelay: 1500, label },
    );
    const choice = res?.choices?.[0];
    return {
      content: typeof choice?.message?.content === 'string' ? choice.message.content : '',
      finishReason: typeof choice?.finish_reason === 'string' ? choice.finish_reason : null,
    };
  } catch (err) {
    if (stats) {
      stats.apiFailures++;
      const billing = isBillingError(err);
      if (billing) stats.billingBlocked = true;
      // Keep the root cause: once the breaker is open every later call only says
      // "Circuit OPEN", which must not overwrite e.g. the credits refusal.
      if (billing || !(err instanceof CircuitOpenError) || !stats.lastError) {
        if (!stats.billingBlocked || billing) {
          stats.lastError = (err instanceof Error ? err.message : String(err)).slice(0, 300);
        }
      }
    }
    throw err;
  }
}
