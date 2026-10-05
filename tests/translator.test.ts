/**
 * Unit tests for the title translator (slice S5) with an injected fake client.
 * No network. Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateTitleBatch, translateArticles } from '../src/workers/translator';
import { newApiStats, type ChatClient } from '../src/lib/xai-client';

interface Call {
  titles: string[];
  system: string;
}

/** Mimics the QA mock server: ECHO → echoed title, TRUNCJSON → response cut at 60%. */
function fakeClient(opts: {
  transform?: (items: any[], titles: string[]) => any[];
  cut?: (titles: string[]) => number | null; // fraction of the JSON to keep
  raw?: (titles: string[]) => string;
  fail?: () => Error | null;
} = {}) {
  const calls: Call[] = [];
  const client: ChatClient = {
    chat: {
      completions: {
        async create(params: any) {
          const system = params.messages.find((m: any) => m.role === 'system').content;
          const user: string = params.messages.find((m: any) => m.role === 'user').content;
          const titles = user.split('\n').map((l) => l.replace(/^\d+\.\s/, ''));
          calls.push({ titles, system });
          const err = opts.fail?.();
          if (err) throw err;
          let content: string;
          if (opts.raw) content = opts.raw(titles);
          else {
            let items = titles.map((t, i) => ({
              idx: i + 1,
              titleKo: /ECHO/.test(t) ? t : `한국어 제목: ${t}`,
              summaryKo: `요약: ${t}`,
              primary: 'world',
              secondary: '',
            }));
            if (opts.transform) items = opts.transform(items, titles);
            content = JSON.stringify(items);
            const frac = opts.cut?.(titles);
            if (frac != null) content = content.slice(0, Math.floor(content.length * frac));
            content = '```json\n' + content + '\n```';
          }
          return { choices: [{ message: { content }, finish_reason: 'stop' }] };
        },
      },
    },
  };
  return { client, calls };
}

const titles = (n: number, mark?: { at: number; text: string }) =>
  Array.from({ length: n }, (_, i) => (mark && i === mark.at ? `${mark.text} ${i}` : `Headline number ${i}`));

test('1 echo in 10 → 9 accepted, the echo is re-requested once alone, then given up', async () => {
  const { client, calls } = fakeClient();
  const stats = newApiStats();
  const r = await translateTitleBatch(titles(10, { at: 4, text: 'ECHO' }), { client, stats, pauseMs: 0 });
  assert.equal(r.filter((x) => x.titleKo).length, 9);
  assert.equal(r[4].titleKo, '');
  assert.equal(r[4].failure, 'rejected');
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].titles, ['ECHO 4']);
  assert.deepEqual(stats, { apiCalls: 2, apiFailures: 0 });
  // title prompt contract kept for the QA mock: system mentions "idx", user "N. title"
  assert.match(calls[0].system, /"idx"/);
});

test('JSON cut at 60% → dropped items re-requested until all are translated', async () => {
  const { client, calls } = fakeClient({ cut: (t) => (t.length === 10 ? 0.6 : null) });
  const r = await translateTitleBatch(titles(10), { client, pauseMs: 0 });
  assert.equal(r.filter((x) => x.titleKo).length, 10);
  r.forEach((x, i) => assert.equal(x.titleKo, `한국어 제목: Headline number ${i}`));
  assert.ok(calls.length >= 2 && calls.length <= 4, `calls=${calls.length}`);
  for (const c of calls.slice(1)) assert.ok(c.titles.length < 10);
});

test('single title cut inside summaryKo → titleKo kept, summaryKo empty', async () => {
  const { client } = fakeClient({
    raw: (t) => `[{"idx":1,"titleKo":"한국어 제목: ${t[0]}","summaryKo":"요약`,
  });
  const [r] = await translateTitleBatch(['TRUNCJSON Oil prices climb'], { client, pauseMs: 0 });
  assert.equal(r.titleKo, '한국어 제목: TRUNCJSON Oil prices climb');
  assert.equal(r.summaryKo, '');
});

test('categories are normalized to the 16 standard slugs', async () => {
  const { client } = fakeClient({
    transform: (items) => items.map((it, i) => ({ ...it, primary: ['Technology', 'AI_Tech', 'tech', 'ECONOMY'][i], secondary: ['Sports', 'opinion', '', 'x'][i] })),
  });
  const r = await translateTitleBatch(titles(4), { client, pauseMs: 0 });
  assert.deepEqual(r.map((x) => x.primary), ['general', 'ai-tech', 'general', 'economy']);
  assert.deepEqual(r.map((x) => x.secondary), ['sports', '', '', '']);
});

test('English summaryKo is dropped (Korean only)', async () => {
  const { client } = fakeClient({ transform: (items) => items.map((it) => ({ ...it, summaryKo: 'An English summary' })) });
  const r = await translateTitleBatch(titles(2), { client, pauseMs: 0 });
  assert.ok(r.every((x) => x.titleKo && x.summaryKo === ''));
});

test('translateArticles: Korean sources pass through, others translated', async () => {
  const { client, calls } = fakeClient();
  const base = { sourceId: 1, originalUrl: 'u', contentOriginal: null, publishedAt: null, country: 'us', author: null, imageUrl: null };
  const out = await translateArticles(
    [
      { ...base, titleOriginal: '한국어 원제목', language: 'ko' },
      { ...base, titleOriginal: 'ECHO Foo', language: 'en' },
      { ...base, titleOriginal: 'Fed holds rates', language: 'en' },
    ],
    { client, pauseMs: 0 },
  );
  assert.equal(out[0].titleKo, '한국어 원제목');
  assert.equal(out[1].titleKo, '');
  assert.equal(out[2].titleKo, '한국어 제목: Fed holds rates');
  assert.equal(out[2].categoryPrimary, 'world');
  assert.ok(calls.every((c) => !c.titles.includes('한국어 원제목')));
});

test('mixed idx: items without idx are dropped (no positional mapping), then re-requested', async () => {
  let first = true;
  const { client, calls } = fakeClient({
    transform: (items) => {
      if (!first) return items;
      first = false;
      // idx 2 missing its idx and placed first: positional mapping would put it on title 1
      const [a, b, c] = items;
      return [{ ...b, idx: undefined, titleKo: '엉뚱한 번역' }, { ...a }, { ...c }];
    },
  });
  const r = await translateTitleBatch(titles(3), { client, pauseMs: 0 });
  assert.equal(r[0].titleKo, '한국어 제목: Headline number 0');
  assert.equal(r[1].titleKo, '한국어 제목: Headline number 1', 'title 2 came from its own re-request');
  assert.equal(r[2].titleKo, '한국어 제목: Headline number 2');
  assert.ok(!r.some((x) => x.titleKo === '엉뚱한 번역'));
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].titles, ['Headline number 1']);
});

test('no idx anywhere → positional fallback still works', async () => {
  const { client } = fakeClient({ transform: (items) => items.map(({ idx, ...rest }) => rest) });
  const r = await translateTitleBatch(titles(3), { client, pauseMs: 0 });
  r.forEach((x, i) => assert.equal(x.titleKo, `한국어 제목: Headline number ${i}`));
});

test('HTTP 503 every time → 3 attempts, no split re-requests, empty results', async () => {
  const { client, calls } = fakeClient({
    fail: () => Object.assign(new Error('Service Unavailable'), { status: 503 }),
  });
  const stats = newApiStats();
  // (last test in this file: the shared text breaker is OPEN afterwards)
  const r = await translateTitleBatch(titles(10), { client, stats, pauseMs: 0 });
  assert.equal(calls.length, 3);
  assert.ok(r.every((x) => x.titleKo === '' && x.failure === 'http'));
  assert.deepEqual(stats, { apiCalls: 1, apiFailures: 1 });
});
