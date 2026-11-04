/**
 * Unit tests for src/lib/auth-policy.ts (slice S4). Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_REALM, WWW_AUTHENTICATE, isValidBasicAuth, requiresAuth } from '../src/lib/auth-policy';

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

test('requiresAuth: policy table', () => {
  const cases: Array<[string, string, boolean]> = [
    ['/admin', 'GET', true],
    ['/admin/', 'GET', true],
    ['/admin/sources', 'GET', true],
    ['/admin/logs', 'HEAD', true],
    ['/adminx', 'GET', false],
    ['/administrator', 'GET', false],
    ['/api/admin/logs', 'GET', true],
    ['/api/admin/stats', 'GET', true],
    ['/api/admin/clear-cache', 'GET', true],
    ['/api/admin/sources', 'PUT', true],
    ['/api/admin', 'GET', true],
    ['/api/admin/health', 'GET', false],
    ['/api/admin/health/', 'GET', false],
    ['/api/admin/health', 'HEAD', false],
    ['/api/admin/health', 'OPTIONS', false],
    ['/api/admin/health', 'POST', true],
    ['/api/admin/healthz', 'GET', true],
    ['/api/admin/articles', 'GET', true],
    ['/api/adminx', 'GET', false],
    ['/api/articles', 'GET', false],
    ['/api/articles/1', 'GET', false],
    ['/api/articles/1', 'HEAD', false],
    ['/api/articles/1', 'PATCH', true],
    ['/api/articles/1', 'DELETE', true],
    ['/api/articles', 'POST', true],
    ['/api/articles', 'PUT', true],
    ['/api/articlesfoo', 'PATCH', false],
    ['/api/collect', 'POST', true],
    ['/api/collect', 'GET', true],
    ['/api/collect/now', 'POST', true],
    ['/api/collector', 'POST', false],
    ['/api/stats', 'GET', false],
    ['/api/search', 'GET', false],
    ['/api/img', 'GET', false],
    ['/', 'GET', false],
    ['/article/1', 'GET', false],
  ];
  for (const [path, method, want] of cases) {
    assert.equal(requiresAuth(path, method), want, `${method} ${path}`);
  }
});

test('requiresAuth: method is case-insensitive', () => {
  assert.equal(requiresAuth('/api/articles/1', 'patch'), true);
  assert.equal(requiresAuth('/api/admin/health', 'get'), false);
  assert.equal(requiresAuth('/api/articles', 'get'), false);
});

test('WWW-Authenticate challenge', () => {
  assert.equal(AUTH_REALM, 'Admin');
  assert.match(WWW_AUTHENTICATE, /^Basic realm="Admin"/);
  assert.match(WWW_AUTHENTICATE, /charset="UTF-8"/);
});

test('isValidBasicAuth', () => {
  const ok = 'Basic ' + b64('admin:livenews2026');
  assert.equal(isValidBasicAuth(ok, 'admin', 'livenews2026'), true);
  assert.equal(isValidBasicAuth('basic ' + b64('admin:livenews2026'), 'admin', 'livenews2026'), true, 'scheme case-insensitive');
  assert.equal(isValidBasicAuth('BASIC  ' + b64('admin:livenews2026'), 'admin', 'livenews2026'), true);
  assert.equal(isValidBasicAuth('Basic ' + b64('admin:wrong'), 'admin', 'livenews2026'), false);
  assert.equal(isValidBasicAuth('Basic ' + b64('root:livenews2026'), 'admin', 'livenews2026'), false);
  assert.equal(isValidBasicAuth('Basic ' + b64('admin:livenews2026x'), 'admin', 'livenews2026'), false);
  assert.equal(isValidBasicAuth('Basic ' + b64('admin:'), 'admin', 'livenews2026'), false);
  assert.equal(isValidBasicAuth('Basic ' + b64('adminlivenews2026'), 'admin', 'livenews2026'), false, 'no colon');
  assert.equal(isValidBasicAuth('Bearer ' + b64('admin:livenews2026'), 'admin', 'livenews2026'), false);
  assert.equal(isValidBasicAuth('', 'admin', 'livenews2026'), false);
  assert.equal(isValidBasicAuth(null, 'admin', 'livenews2026'), false);
  assert.equal(isValidBasicAuth(undefined, 'admin', 'livenews2026'), false);
  assert.equal(isValidBasicAuth('Basic', 'admin', 'livenews2026'), false);
  assert.equal(isValidBasicAuth('Basic !!!not-base64!!!', 'admin', 'livenews2026'), false);
  assert.equal(isValidBasicAuth('Basic YWRt', 'admin', 'livenews2026'), false);
  assert.equal(isValidBasicAuth('Basic A', 'admin', 'livenews2026'), false);
  // password containing ':' — split on the first ':'
  assert.equal(isValidBasicAuth('Basic ' + b64('admin:pa:ss'), 'admin', 'pa:ss'), true);
  assert.equal(isValidBasicAuth('Basic ' + b64('admin:pa'), 'admin', 'pa:ss'), false);
  // UTF-8 credentials
  assert.equal(isValidBasicAuth('Basic ' + b64('관리자:비밀'), '관리자', '비밀'), true);
});

test('isValidBasicAuth never throws on odd input', () => {
  for (const h of ['Basic ====', 'Basic /w==', 'Basic //79', 'Basic ' + 'A'.repeat(10_001), '\u0000', 'Basic ÿþ']) {
    assert.doesNotThrow(() => isValidBasicAuth(h, 'admin', 'x'));
    assert.equal(isValidBasicAuth(h, 'admin', 'x'), false);
  }
});
