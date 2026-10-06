/**
 * Unit tests for src/lib/routing.ts (slice S4). Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, COUNTRY_SUBCATEGORIES } from '../src/lib/constants';
import {
  forwardsListQuery,
  isKnownCategorySlug,
  normalizeRankingCountry,
  pageFromQuery,
  pageHref,
  parseArticleId,
  resolvePageRequest,
} from '../src/lib/routing';

test('parseArticleId: valid ids', () => {
  assert.equal(parseArticleId('1'), 1);
  assert.equal(parseArticleId('407'), 407);
  assert.equal(parseArticleId('2147483647'), 2147483647);
  assert.equal(parseArticleId(['5', '6']), 5, 'arrays: first element is used');
  assert.equal(parseArticleId(12), 12);
});

test('parseArticleId: everything else → null', () => {
  for (const raw of ['2147483648', '99999999999', '0', '00', '12abc', 'abc', '', ' 1', '1 ', '-1', '+1', '1.0', '1e3', '１', [], [undefined], null, undefined, 0, -3, 1.5, NaN, Infinity, {}]) {
    assert.equal(parseArticleId(raw), null, JSON.stringify(raw));
  }
});

test('isKnownCategorySlug', () => {
  for (const c of CATEGORIES) assert.equal(isKnownCategorySlug(c.slug), true, c.slug);
  for (const list of Object.values(COUNTRY_SUBCATEGORIES)) {
    for (const s of list) assert.equal(isKnownCategorySlug(s.slug), true, `subcategory ${s.slug}`);
  }
  assert.equal(isKnownCategorySlug('international-politics'), true);
  for (const bad of ['zzz', 'quantum-weird-category', 'opinion', 'Economy', '', '__proto__', 'constructor', 'toString', undefined, null, ['economy'], 1]) {
    assert.equal(isKnownCategorySlug(bad), false, String(bad));
  }
});

test('resolvePageRequest', () => {
  assert.deepEqual(resolvePageRequest(1, 0), { kind: 'ok' });
  assert.deepEqual(resolvePageRequest(2, 0), { kind: 'redirect', page: 1 });
  assert.deepEqual(resolvePageRequest(1, 1), { kind: 'ok' });
  assert.deepEqual(resolvePageRequest(14, 14), { kind: 'ok' });
  assert.deepEqual(resolvePageRequest(15, 14), { kind: 'redirect', page: 14 });
  assert.deepEqual(resolvePageRequest(999, 14), { kind: 'redirect', page: 14 });
  assert.deepEqual(resolvePageRequest(3, 2.5), { kind: 'redirect', page: 2 });
  assert.deepEqual(resolvePageRequest(2, NaN), { kind: 'redirect', page: 1 });
});

test('pageHref', () => {
  assert.equal(pageHref('/breaking', 1), '/breaking');
  assert.equal(pageHref('/breaking', 14), '/breaking?page=14');
  assert.equal(pageHref('/category/economy', 2), '/category/economy?page=2');
});

test('normalizeRankingCountry', () => {
  for (const c of ['all', 'global', 'us', 'japan', 'china']) assert.equal(normalizeRankingCountry(c), c);
  assert.equal(normalizeRankingCountry(['us', 'japan']), 'us');
  for (const bad of ['xyz', 'US', '', ' us', undefined, null, '__proto__', ['xyz'], 3]) {
    assert.equal(normalizeRankingCountry(bad), 'all', String(bad));
  }
});

test('list query forwarding helpers', () => {
  assert.equal(forwardsListQuery('/breaking'), true);
  assert.equal(forwardsListQuery('/category/economy'), true);
  assert.equal(forwardsListQuery('/breakingx'), false);
  assert.equal(forwardsListQuery('/world'), false);
  assert.equal(forwardsListQuery('/admin'), false);
  assert.equal(pageFromQuery('?page=3'), 3);
  assert.equal(pageFromQuery('page=14&x=1'), 14);
  assert.equal(pageFromQuery('?page=abc'), 1);
  assert.equal(pageFromQuery('?page=-2'), 1);
  assert.equal(pageFromQuery(''), 1);
  assert.equal(pageFromQuery(null), 1);
  assert.equal(pageFromQuery('?page=99999999999'), 10_000);
});
