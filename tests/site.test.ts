/**
 * Unit tests for src/lib/site.ts (slice S2). Run: npm test
 * Pure functions only — no network, no DB. Tests that change process.env.TZ restore it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BASE_PATH,
  SITE_STATS_PATH,
  formatKstClock,
  isAdminPath,
  kstYear,
  parseSiteStats,
  startOfKstDay,
  withBasePath,
} from '../src/lib/site';

const withTZ = <T>(tz: string, fn: () => T): T => {
  const prev = process.env.TZ;
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    if (prev === undefined) delete process.env.TZ;
    else process.env.TZ = prev;
  }
};
const TZS = ['UTC', 'Asia/Seoul', 'America/Los_Angeles', 'Pacific/Kiritimati'];

test('BASE_PATH mirrors next.config.js; withBasePath prefixes once', () => {
  const cfg = readFileSync(join(__dirname, '..', 'next.config.js'), 'utf8');
  assert.equal(BASE_PATH, (cfg.match(/basePath:\s*['"]([^'"]*)['"]/) || [])[1]);
  assert.equal(withBasePath('/'), '/livenews');
  assert.equal(withBasePath(''), '/livenews');
  assert.equal(withBasePath('/api/stats'), '/livenews/api/stats');
  assert.equal(withBasePath('api/stats'), '/livenews/api/stats');
  assert.equal(SITE_STATS_PATH, '/api/stats');
});

test('isAdminPath is segment-exact', () => {
  for (const p of ['/admin', '/admin/', '/admin/sources', '/admin/logs/x']) assert.equal(isAdminPath(p), true, p);
  for (const p of ['/', '/administrator', '/admins', '/article/1', '/livenews/admin', '', null, undefined])
    assert.equal(isAdminPath(p), false, String(p));
});

test('formatKstClock / kstYear / startOfKstDay are TZ-independent', () => {
  for (const tz of TZS)
    withTZ(tz, () => {
      assert.deepEqual(formatKstClock(Date.UTC(2026, 9, 5, 15, 14, 5)), {
        label: '10월 6일 (화) 00:14:05',
        dateTime: '2026-10-05T15:14:05.000Z',
      });
      assert.deepEqual(formatKstClock(new Date(Date.UTC(2026, 11, 31, 15, 0, 0))), {
        label: '1월 1일 (금) 00:00:00',
        dateTime: '2026-12-31T15:00:00.000Z',
      });
      assert.equal(formatKstClock(NaN), null);
      assert.equal(formatKstClock(new Date('garbage')), null);
      assert.equal(kstYear(Date.UTC(2026, 11, 31, 14, 59, 59)), 2026);
      assert.equal(kstYear(Date.UTC(2026, 11, 31, 15, 0, 0)), 2027);
      assert.equal(startOfKstDay(Date.UTC(2026, 9, 5, 15, 14, 21)).toISOString(), '2026-10-05T15:00:00.000Z');
      assert.equal(startOfKstDay(Date.UTC(2026, 9, 5, 15, 0, 0)).toISOString(), '2026-10-05T15:00:00.000Z');
      assert.equal(startOfKstDay(Date.UTC(2026, 9, 5, 14, 59, 59)).toISOString(), '2026-10-04T15:00:00.000Z');
      assert.equal(startOfKstDay(new Date(Date.UTC(2028, 1, 28, 15, 30))).toISOString(), '2028-02-28T15:00:00.000Z');
    });
  assert.throws(() => startOfKstDay(NaN), RangeError);
});

test('parseSiteStats accepts only 3 non-negative integers', () => {
  const ok = { totalArticles: 409, articlesToday: 0, activeSources: 30 };
  assert.deepEqual(parseSiteStats(ok), ok);
  assert.deepEqual(parseSiteStats({ ...ok, recentLogs: [1], byCountry: [] }), ok);
  for (const bad of [
    null,
    undefined,
    'x',
    [],
    {},
    { ...ok, totalArticles: '409' },
    { ...ok, articlesToday: -1 },
    { ...ok, activeSources: 1.5 },
    { ...ok, totalArticles: NaN },
    { totalArticles: 1, articlesToday: 1 },
  ])
    assert.equal(parseSiteStats(bad), null, JSON.stringify(bad));
});
