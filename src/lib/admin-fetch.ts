// Admin screens' data loader (slice S4): turns HTTP/network/payload failures into an explicit
// error kind instead of an empty list. No React / next imports; `fetchImpl` is injectable for tests.
import { withBasePath } from './site';

export type AdminFetchErrorKind = 'auth' | 'server' | 'network' | 'invalid';

export type AdminFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: AdminFetchErrorKind; status?: number };

/** true for the AbortError an AbortController raises (effect cleanup) — callers ignore it. */
export const isAbortError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { name?: unknown }).name === 'AbortError';

/**
 * GET (or `init`) an admin JSON endpoint.
 * @param path '/api/…' without the basePath (added here)
 * - 401/403 → 'auth', other non-2xx → 'server', fetch rejected → 'network',
 *   unparsable JSON or `validate` false → 'invalid'. AbortError is re-thrown (callers ignore it).
 */
export async function fetchAdminJson<T>(
  path: string,
  validate: (json: unknown) => json is T,
  init?: RequestInit,
  fetchImpl: typeof fetch = fetch,
): Promise<AdminFetchResult<T>> {
  let res: Response;
  try {
    res = await fetchImpl(withBasePath(path), init);
  } catch (err) {
    if (isAbortError(err)) throw err;
    return { ok: false, kind: 'network' };
  }
  if (res.status === 401 || res.status === 403) return { ok: false, kind: 'auth', status: res.status };
  if (!res.ok) return { ok: false, kind: 'server', status: res.status };

  let json: unknown;
  try {
    json = await res.json();
  } catch (err) {
    if (isAbortError(err)) throw err;
    return { ok: false, kind: 'invalid', status: res.status };
  }
  if (!validate(json)) return { ok: false, kind: 'invalid', status: res.status };
  return { ok: true, data: json };
}

/** Minimal payload guards for the admin screens. */
export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** `{ [key]: Array<{ id: number, … }> }` */
export function hasRowsWithId(json: unknown, key: string): boolean {
  if (!isRecord(json)) return false;
  const rows = json[key];
  return Array.isArray(rows) && rows.every((r) => isRecord(r) && typeof r.id === 'number');
}
