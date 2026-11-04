/**
 * Unit tests for src/workers/recent-processor.ts (npm run ai:recent). Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateRequests, planArticleWork, type RecentRow } from '../src/workers/recent-processor';

const EN = 'The Federal Reserve said inflation cooled faster than expected this quarter.';

function row(over: Partial<RecentRow> = {}): RecentRow {
  return {
    id: 1,
    originalUrl: 'https://news.example.com/1',
    titleOriginal: 'Fed signals rate cuts',
    titleKo: '연준, 금리 인하 신호',
    summaryKo: '연준이 금리 인하를 시사했다.',
    contentOriginal: EN,
    contentKo: '연준은 이번 분기 물가가 예상보다 빨리 둔화했다고 밝혔다.',
    language: 'en',
    categoryPrimary: 'economy',
    imageUrl: 'https://cdn.example.com/photo.jpg',
    ...over,
  };
}

test('fully processed article → nothing to do', () => {
  assert.deepEqual(planArticleWork(row()), { title: false, summary: false, body: false, image: false });
});

test('missing / echoed title, missing summary, missing body, no photo are each detected', () => {
  assert.equal(planArticleWork(row({ titleKo: null })).title, true);
  assert.equal(planArticleWork(row({ titleKo: 'Fed signals rate cuts' })).title, true); // English echo
  assert.equal(planArticleWork(row({ summaryKo: null })).summary, true);
  assert.equal(planArticleWork(row({ contentKo: null })).body, true);
  assert.equal(planArticleWork(row({ contentKo: EN })).body, true); // no Hangul
  assert.equal(planArticleWork(row({ imageUrl: null })).image, true);
  assert.equal(planArticleWork(row({ imageUrl: 'https://static.example.com/assets/logo.png' })).image, true); // logo, not a photo
  assert.equal(planArticleWork(row({ imageUrl: '/livenews/api/generated-image/0123456789abcdef0123456789abcdef.jpg' })).image, false);
});

test('truncated old translation (6000-char cut) is re-translated', () => {
  const long = Array.from({ length: 60 }, () => `${EN} ${EN}`).join('\n'); // ≈ 9000 chars > 6000
  const cut = Array.from({ length: 12 }, () => '번역된 문단입니다.').join('\n');
  assert.equal(planArticleWork(row({ contentOriginal: long, contentKo: cut })).body, true);
});

test('Korean-language sources never need translation; options', () => {
  const ko = row({ language: 'ko', titleKo: null, summaryKo: null, contentKo: null, imageUrl: null });
  assert.deepEqual(planArticleWork(ko), { title: false, summary: false, body: false, image: true });
  assert.equal(planArticleWork(row({ imageUrl: null }), { images: false }).image, false);
  assert.deepEqual(planArticleWork(row(), { retranslate: true }), { title: true, summary: true, body: true, image: false });
  assert.equal(planArticleWork(row({ contentOriginal: 'short' }), { retranslate: true }).body, false);
});

test('estimateRequests: titles 10 per request, bodies by 3000-char chunks, images 1 each', () => {
  const rows = [
    row({ id: 1, titleKo: null }),
    row({ id: 2, summaryKo: null, contentKo: null, contentOriginal: 'x'.repeat(7000) }),
    row({ id: 3, imageUrl: null }),
  ];
  const plans = rows.map((r) => planArticleWork(r));
  assert.deepEqual(estimateRequests(rows, plans), { text: 1 + 3, images: 1 });
});
