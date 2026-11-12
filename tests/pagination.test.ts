/**
 * Unit tests for src/lib/pagination.ts (slice S3, D5). Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPageItems, getPrevNext, normalizeTotalPages, type PageItem } from '../src/lib/pagination';

const G = 'gap' as const;

test('getPageItems: siblings=0, total=14 (mobile, 5 fixed slots)', () => {
  const cases: [number, PageItem[]][] = [
    [1, [1, 2, 3, G, 14]],
    [2, [1, 2, 3, G, 14]],
    [3, [1, 2, 3, G, 14]],
    [4, [1, G, 4, G, 14]],
    [7, [1, G, 7, G, 14]],
    [11, [1, G, 11, G, 14]],
    [12, [1, G, 12, 13, 14]],
    [13, [1, G, 12, 13, 14]],
    [14, [1, G, 12, 13, 14]],
  ];
  for (const [c, want] of cases) assert.deepEqual(getPageItems(c, 14, 0), want, `c=${c}`);
});

test('getPageItems: siblings=2, total=14 (desktop, 9 slots)', () => {
  assert.deepEqual(getPageItems(1, 14, 2), [1, 2, 3, 4, 5, 6, 7, G, 14]);
  assert.deepEqual(getPageItems(7, 14, 2), [1, G, 5, 6, 7, 8, 9, G, 14]);
  assert.deepEqual(getPageItems(14, 14, 2), [1, G, 8, 9, 10, 11, 12, 13, 14]);
});

test('getPageItems: small totals list every page', () => {
  assert.deepEqual(getPageItems(3, 5, 0), [1, 2, 3, 4, 5]);
  assert.deepEqual(getPageItems(2, 7, 1), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(getPageItems(1, 1, 0), [1]);
});

test('getPageItems: invalid / out-of-range input is normalized', () => {
  const first = getPageItems(1, 14, 0);
  for (const c of [NaN, 0, -3]) assert.deepEqual(getPageItems(c, 14, 0), first, `c=${c}`);
  assert.deepEqual(getPageItems(999, 14, 0), getPageItems(14, 14, 0));
  assert.deepEqual(getPageItems(1, NaN, 0), [1]);
  assert.deepEqual(getPageItems(1, 0, 0), [1]);
  // non-integer total is floored, not reset to 1
  assert.deepEqual(getPageItems(7, 14.5, 0), getPageItems(7, 14, 0));
  assert.deepEqual(getPageItems(7, 14.5, 2), getPageItems(7, 14, 2));
  assert.deepEqual(getPrevNext(7, 14.5), { prev: 6, next: 8 });
  assert.deepEqual(getPrevNext(999, 14.5), { prev: 14, next: null });
});

test('normalizeTotalPages', () => {
  const cases: [number, number][] = [[14, 14], [14.5, 14], [1.9, 1], [1, 1], [0, 1], [-3, 1], [NaN, 1], [Infinity, 1]];
  for (const [t, want] of cases) assert.equal(normalizeTotalPages(t), want, String(t));
});

test('getPageItems: fuzz invariants', () => {
  let seed = 42;
  const rand = (n: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return 1 + (seed % n);
  };
  for (let k = 0; k < 3000; k++) {
    const total = rand(600);
    const current = rand(total);
    for (const s of [0, 2]) {
      const items = getPageItems(current, total, s);
      const label = `c=${current} t=${total} s=${s} → ${JSON.stringify(items)}`;
      assert.equal(items.length, Math.min(total, 2 * s + 5), label);
      const nums = items.filter((x): x is number => x !== G);
      assert.ok(nums.includes(1) && nums.includes(total) && nums.includes(current), label);
      for (let i = 1; i < nums.length; i++) assert.ok(nums[i] > nums[i - 1], label);
      items.forEach((x, i) => {
        if (x !== G) return;
        assert.notEqual(items[i + 1], G, label);
        const before = items[i - 1] as number;
        const after = items[i + 1] as number;
        assert.ok(after - before - 1 >= 2, `gap hides <2 pages: ${label}`);
      });
    }
  }
});

test('getPrevNext', () => {
  assert.deepEqual(getPrevNext(1, 14), { prev: null, next: 2 });
  assert.deepEqual(getPrevNext(7, 14), { prev: 6, next: 8 });
  assert.deepEqual(getPrevNext(14, 14), { prev: 13, next: null });
  assert.deepEqual(getPrevNext(999, 14), { prev: 14, next: null });
  assert.deepEqual(getPrevNext(NaN, 14), { prev: null, next: 2 });
  for (const c of [NaN, -5, 0, 1, 2, 7, 13, 14, 15, 999, 1.5]) {
    for (const t of [1, 2, 14]) {
      const { prev, next } = getPrevNext(c, t);
      for (const v of [prev, next]) assert.ok(v === null || (Number.isInteger(v) && v >= 1 && v <= t), `c=${c} t=${t} v=${v}`);
    }
  }
});
