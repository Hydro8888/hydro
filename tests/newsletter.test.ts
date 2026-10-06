/**
 * Unit tests for src/lib/newsletter.ts (slice S2, contract C). Run: npm test
 * No network: subscribeNewsletter gets an injected fake fetch.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NEWSLETTER_ENABLED,
  NEWSLETTER_ENDPOINT,
  isFlagOn,
  isNewsletterBannerPath,
  subscribeNewsletter,
} from '../src/lib/newsletter';

test('isFlagOn: only the exact string "true" enables', () => {
  assert.equal(isFlagOn('true'), true);
  for (const v of ['TRUE', ' true', 'true ', '1', 'yes', 'false', '', undefined, null]) assert.equal(isFlagOn(v), false, String(v));
  assert.equal(NEWSLETTER_ENABLED, isFlagOn(process.env.NEXT_PUBLIC_NEWSLETTER_ENABLED));
});

test('endpoint + banner routes', () => {
  assert.equal(NEWSLETTER_ENDPOINT, '/livenews/api/newsletter');
  for (const p of ['/', '/world', '/us', '/japan', '/china']) assert.equal(isNewsletterBannerPath(p), true, p);
  for (const p of ['/global', '/breaking', '/article/1', '/admin', '/world/x', '', null])
    assert.equal(isNewsletterBannerPath(p), false, String(p));
});

test('subscribeNewsletter never reports success without a 2xx response', async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fake = (status: number | 'throw') =>
    (async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      if (status === 'throw') throw new TypeError('network down');
      return new Response(null, { status });
    }) as typeof fetch;

  assert.deepEqual(await subscribeNewsletter('  reader@example.com ', fake(200)), { ok: true });
  assert.equal(calls[0].url, '/livenews/api/newsletter');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(new Headers(calls[0].init.headers).get('content-type'), 'application/json');
  assert.equal(calls[0].init.body, '{"email":"reader@example.com"}');
  assert.deepEqual(await subscribeNewsletter('reader@example.com', fake(201)), { ok: true });
  assert.deepEqual(await subscribeNewsletter('reader@example.com', fake(404)), { ok: false, reason: 'http' });
  assert.deepEqual(await subscribeNewsletter('reader@example.com', fake(500)), { ok: false, reason: 'http' });
  assert.deepEqual(await subscribeNewsletter('reader@example.com', fake('throw')), { ok: false, reason: 'network' });

  const before = calls.length;
  assert.deepEqual(await subscribeNewsletter('', fake(200)), { ok: false, reason: 'invalid' });
  assert.deepEqual(await subscribeNewsletter('not-an-email', fake(200)), { ok: false, reason: 'invalid' });
  assert.equal(calls.length, before);
});
