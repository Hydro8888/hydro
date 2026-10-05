/**
 * Unit tests for src/lib/image-chain.ts (slice S3, D2/D3). Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextImageIndex, resolveImageSources } from '../src/lib/image-chain';
import { getArticleImageSources } from '../src/lib/utils';
import { IMAGE_PLACEHOLDER_SRC } from '../src/lib/constants';

test('nextImageIndex advances and stops at the last entry', () => {
  const cases: [number, number, number][] = [
    [0, 3, 1],
    [1, 3, 2],
    [2, 3, 2],
    [5, 3, 2],
    [0, 1, 0],
    [0, 0, 0],
  ];
  for (const [idx, len, want] of cases) assert.equal(nextImageIndex(idx, len), want, `(${idx},${len})`);
});

function assertChain(list: string[]) {
  assert.ok(list.length >= 1);
  assert.equal(list[list.length - 1], IMAGE_PLACEHOLDER_SRC);
  assert.equal(new Set(list).size, list.length, 'no duplicates');
  assert.ok(list.every((s) => s.trim() !== ''), 'no blanks');
}

test('resolveImageSources: sources from getArticleImageSources pass through', () => {
  const sources = getArticleImageSources({ id: 1, imageUrl: 'https://cdn.example.com/a.jpg', categoryPrimary: 'economy' });
  const list = resolveImageSources({ sources });
  assert.equal(list.length, 3);
  assert.deepEqual(list, sources);
  assertChain(list);
});

test('resolveImageSources: legacy src/fallback pair', () => {
  assert.deepEqual(resolveImageSources({ src: '/x.jpg', fallback: 'https://images.unsplash.com/p' }), [
    '/x.jpg',
    'https://images.unsplash.com/p',
    IMAGE_PLACEHOLDER_SRC,
  ]);
  const same = resolveImageSources({ src: '/x.jpg', fallback: '/x.jpg' });
  assert.deepEqual(same, ['/x.jpg', IMAGE_PLACEHOLDER_SRC]);
  // sources wins over the legacy pair when non-empty
  assert.deepEqual(resolveImageSources({ sources: ['/a.jpg'], src: '/x.jpg' }), ['/a.jpg', IMAGE_PLACEHOLDER_SRC]);
});

test('resolveImageSources: empty input ends at the placeholder', () => {
  for (const p of [{ sources: [] }, {}, { src: '' }, { sources: ['', '  '], fallback: '' }, { sources: null }])
    assert.deepEqual(resolveImageSources(p), [IMAGE_PLACEHOLDER_SRC], JSON.stringify(p));
});

test('resolveImageSources: placeholder is always last and only once', () => {
  const list = resolveImageSources({ sources: [IMAGE_PLACEHOLDER_SRC, '/a.jpg', '/a.jpg', '/b.jpg'] });
  assert.deepEqual(list, ['/a.jpg', '/b.jpg', IMAGE_PLACEHOLDER_SRC]);
  for (const id of [1, 2, 'x', -7]) {
    for (const imageUrl of [null, '', 'https://cdn.example.com/p.jpg', 'notaurl']) {
      assertChain(resolveImageSources({ sources: getArticleImageSources({ id, imageUrl, categoryPrimary: 'world' }) }));
    }
  }
});
