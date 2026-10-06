/**
 * Unit tests for chunked body translation + finish_reason handling (slice S5).
 * Fake client, no network. Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateLongText, translateContent } from '../src/workers/content-translator';
import { countParagraphs } from '../src/workers/translation-text';
import type { ChatClient } from '../src/lib/xai-client';

const EN_PARA = [
  'The Federal Reserve said in a statement on Wednesday that inflation was cooling faster than many economists had predicted, opening the door to rate cuts later this year.',
  'Market analysts said the decision could mark a turning point for the broader economy, although risks remain elevated across several sectors.',
  'Officials said further measures would be announced in the coming weeks as negotiations continue with industry stakeholders.',
  'Supply chains are expected to keep shifting as companies diversify production away from single-country dependence.',
];
const body = (n: number, prefix = '') =>
  Array.from({ length: n }, (_, i) => `${prefix}${EN_PARA[i % EN_PARA.length]}`).join('\n');

/**
 * Same behaviour as the QA mock: one "번역된 문단" line per input paragraph;
 * `lengthOver` → finish_reason "length" with a third of the output when the
 * request is longer than that.
 */
function fakeClient(opts: { lengthOver?: number; always?: 'length' | 'english' | 'empty' } = {}) {
  const sizes: number[] = [];
  const systems: string[] = [];
  const client: ChatClient = {
    chat: {
      completions: {
        async create(params: any) {
          const user: string = params.messages.find((m: any) => m.role === 'user').content;
          systems.push(params.messages.find((m: any) => m.role === 'system').content);
          sizes.push(user.length);
          const paras = user.split(/\n+/).filter((p) => p.trim());
          const translated = paras.map((p) => `번역된 문단: ${p.slice(0, 40)}`).join('\n\n');
          if (opts.always === 'length') return { choices: [{ message: { content: translated.slice(0, 20) }, finish_reason: 'length' }] };
          if (opts.always === 'english') return { choices: [{ message: { content: user }, finish_reason: 'stop' }] };
          if (opts.always === 'empty') return { choices: [{ message: { content: '' }, finish_reason: 'stop' }] };
          if (opts.lengthOver !== undefined && user.length > opts.lengthOver) {
            return { choices: [{ message: { content: translated.slice(0, Math.floor(translated.length / 3)) }, finish_reason: 'length' }] };
          }
          return { choices: [{ message: { content: translated }, finish_reason: 'stop' }] };
        },
      },
    },
  };
  return { client, sizes, systems };
}

const fast = { chunkPauseMs: 0 };

test('8000-char / 60-paragraph body → ≥ 3 chunks ≤ 3000 chars, 60 paragraphs back', async () => {
  const { client, sizes, systems } = fakeClient();
  const text = body(60);
  const r = await translateLongText(text, { client, language: 'en', ...fast });
  assert.equal(r.ok, true);
  assert.ok(sizes.length >= 3, `requests=${sizes.length}`);
  assert.ok(sizes.every((n) => n <= 3000), `sizes=${sizes}`);
  if (r.ok) {
    assert.equal(countParagraphs(r.text), 60);
    assert.ok(!r.text.includes('\n\n'), 'paragraphs separated by a single newline');
  }
  // body prompt must not look like a title request to the QA mock
  for (const s of systems) {
    assert.doesNotMatch(s, /idx/);
    assert.doesNotMatch(s, /제목/);
    assert.match(s, /영어/);
  }
});

test('finish_reason "length" above 1200 chars → re-split, still complete', async () => {
  const { client, sizes } = fakeClient({ lengthOver: 1200 });
  const text = body(24, 'LENGTHCUT ');
  const r = await translateLongText(text, { client, ...fast });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(countParagraphs(r.text), 24);
    assert.ok(r.text.split('\n').every((l) => l.startsWith('번역된 문단:')));
  }
  assert.ok(sizes.some((n) => n > 1200), 'a cut response was actually seen');
  assert.ok(sizes.every((n) => n <= 3000));
});

test('always "length" → ok:false (nothing to save)', async () => {
  const { client } = fakeClient({ always: 'length' });
  const r = await translateLongText(body(10), { client, ...fast });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.http, false);
});

test('response without Hangul (echo) or empty → ok:false', async () => {
  for (const always of ['english', 'empty'] as const) {
    const { client } = fakeClient({ always });
    const r = await translateLongText(body(3), { client, ...fast });
    assert.equal(r.ok, false, always);
  }
});

test('4000-char single paragraph → every request ≤ 3000, result is one paragraph', async () => {
  const { client, sizes } = fakeClient();
  const long = Array.from({ length: 80 }, (_, i) => `Sentence ${i} describes the market reaction in a little more detail.`)
    .join(' ')
    .slice(0, 4000);
  assert.ok(!long.includes('\n') && long.length === 4000);
  const r = await translateLongText(long, { client, ...fast });
  assert.equal(r.ok, true);
  assert.ok(sizes.length >= 2);
  assert.ok(sizes.every((n) => n <= 3000));
  if (r.ok) assert.equal(countParagraphs(r.text), 1);
});

test('HTTP failure → ok:false with http:true', async () => {
  const client: ChatClient = {
    chat: { completions: { create: async () => { throw Object.assign(new Error('bad key'), { status: 401 }); } } },
  };
  const r = await translateLongText(body(2), { client, ...fast });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.http, true);
});

test('translateContent: complete → contentKo, failure → "", Korean original passes through', async () => {
  const { client } = fakeClient({ lengthOver: 1200 });
  const base = { sourceId: 1, originalUrl: 'u', publishedAt: null, country: 'us', author: null, imageUrl: null, language: 'en' };
  const articles = [
    { ...base, titleOriginal: 'a', contentOriginal: body(24, 'LENGTHCUT ') },
    { ...base, titleOriginal: 'b', contentOriginal: '미국 연방준비제도는 이날 성명을 통해 물가 상승세가 예상보다 빠르게 둔화하고 있다고 밝혔다.' },
    { ...base, titleOriginal: 'c', contentOriginal: 'short' },
  ];
  await translateContent(articles, { client, articlePauseMs: 0, chunkPauseMs: 0 });
  assert.equal(countParagraphs((articles[0] as any).contentKo), 24);
  assert.equal((articles[1] as any).contentKo, articles[1].contentOriginal);
  assert.equal((articles[2] as any).contentKo, undefined);

  const bad = fakeClient({ always: 'length' });
  const one = [{ ...base, titleOriginal: 'd', contentOriginal: body(5) }];
  await translateContent(one, { client: bad.client, articlePauseMs: 0, chunkPauseMs: 0 });
  assert.equal((one[0] as any).contentKo, '');
});
