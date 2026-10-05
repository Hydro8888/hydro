/**
 * Unit tests for src/lib/admin-fetch.ts (slice S4). Run: npm test
 * fetch is injected — no network.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchAdminJson, hasRowsWithId } from '../src/lib/admin-fetch';

type Payload = { sources: Array<{ id: number }> };
const isPayload = (j: unknown): j is Payload => hasRowsWithId(j, 'sources');

function fakeFetch(respond: () => Response | Promise<Response>) {
  const calls: string[] = [];
  const impl = (async (input: RequestInfo | URL) => {
    calls.push(String(input));
    return respond();
  }) as typeof fetch;
  return { impl, calls };
}
const json = (status: number, body: unknown) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

test('200 + valid payload → ok, URL gets the basePath', async () => {
  const f = fakeFetch(() => json(200, { sources: [{ id: 1 }, { id: 2 }] }));
  const r = await fetchAdminJson('/api/admin/sources', isPayload, undefined, f.impl);
  assert.deepEqual(r, { ok: true, data: { sources: [{ id: 1 }, { id: 2 }] } });
  assert.deepEqual(f.calls, ['/livenews/api/admin/sources']);
});

test('200 + wrong shape / bad JSON → invalid', async () => {
  for (const body of [{ error: 'x' }, { sources: 'nope' }, { sources: [{ id: '1' }] }, [], 'not json{']) {
    const f = fakeFetch(() => json(200, body));
    const r = await fetchAdminJson('/api/admin/sources', isPayload, undefined, f.impl);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.kind, 'invalid', JSON.stringify(body));
  }
});

test('401 / 403 → auth, other errors → server', async () => {
  for (const [status, kind] of [[401, 'auth'], [403, 'auth'], [500, 'server'], [502, 'server'], [404, 'server']] as const) {
    const f = fakeFetch(() => json(status, { error: 'x' }));
    const r = await fetchAdminJson('/api/admin/logs?page=1', isPayload, undefined, f.impl);
    assert.deepEqual(r, { ok: false, kind, status });
    assert.deepEqual(f.calls, ['/livenews/api/admin/logs?page=1']);
  }
});

test('fetch rejects → network; AbortError is re-thrown', async () => {
  const f = fakeFetch(() => { throw new TypeError('Failed to fetch'); });
  assert.deepEqual(await fetchAdminJson('/api/admin/stats', isPayload, undefined, f.impl), { ok: false, kind: 'network' });

  const abort = fakeFetch(() => { throw new DOMException('aborted', 'AbortError'); });
  await assert.rejects(fetchAdminJson('/api/admin/stats', isPayload, undefined, abort.impl), { name: 'AbortError' });
});

test('init is passed through', async () => {
  let seen: RequestInit | undefined;
  const impl = (async (_i: RequestInfo | URL, init?: RequestInit) => { seen = init; return json(200, { sources: [] }); }) as typeof fetch;
  const controller = new AbortController();
  const r = await fetchAdminJson('/api/admin/sources', isPayload, { signal: controller.signal }, impl);
  assert.equal(r.ok, true);
  assert.equal(seen?.signal, controller.signal);
});
