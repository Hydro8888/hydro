/**
 * Unit tests for src/lib/paragraphs.ts (readable article paragraphs). Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LONG_PARAGRAPH_CHARS,
  MAX_PARAGRAPH_CHARS,
  reflowParagraph,
  reflowParagraphs,
  splitSentences,
} from '../src/lib/paragraphs';

const KO_SENTENCES = [
  '도널드 트럼프 미국 대통령은 화요일 미국과 이스라엘 관계의 역사적인 전환을 발표했다.',
  '그는 연간 40억 달러의 지원금을 연말까지 중단하기로 합의했다고 밝혔다.',
  '트럼프 대통령은 “이스라엘은 더 이상 지원이 필요하지 않다”고 말했다.',
  '이번 결정은 중간선거를 앞두고 나왔다.',
  '전문가들은 중동 정세에 미칠 영향을 주시하고 있다.',
  '백악관은 세부 일정은 추후 발표하겠다고 덧붙였다.',
  '이스라엘 정부는 아직 공식 입장을 내지 않았다.',
  '시장은 이 소식에 즉각 반응했다.',
];
const WALL = Array.from({ length: 3 }, () => KO_SENTENCES.join(' ')).join(' '); // ≈ 900 chars, one paragraph

const words = (s: string) => s.split(/\s+/).filter(Boolean);

test('a Korean wall of text becomes several readable paragraphs', () => {
  assert.ok(WALL.length > LONG_PARAGRAPH_CHARS);
  const out = reflowParagraph(WALL);
  assert.ok(out.length >= 3, `expected ≥3 paragraphs, got ${out.length}`);
  for (const p of out) assert.ok(p.length <= MAX_PARAGRAPH_CHARS + 120, `paragraph too long: ${p.length}`);
  // every paragraph ends at a sentence end
  for (const p of out) assert.match(p, /[.!?”"]$/);
});

test('no text is lost, changed or reordered', () => {
  const out = reflowParagraph(WALL);
  assert.deepEqual(words(out.join(' ')), words(WALL));
});

test('short paragraphs and existing paragraph breaks are kept as they are', () => {
  assert.deepEqual(reflowParagraph('짧은 문단입니다. 두 문장입니다.'), ['짧은 문단입니다. 두 문장입니다.']);
  const text = '첫 문단입니다.\n\n두 번째 문단입니다.\n';
  assert.equal(reflowParagraphs(text), '첫 문단입니다.\n두 번째 문단입니다.');
  assert.equal(reflowParagraphs(null), '');
});

test('idempotent: reflowing twice gives the same result', () => {
  const once = reflowParagraphs(WALL);
  assert.equal(reflowParagraphs(once), once);
});

test('English abbreviations, initials and decimals do not end a sentence', () => {
  const s = splitSentences(
    'Mr. Kim met U.S. officials in Washington, D.C. on Jan. 5 to discuss the 3.5 percent rise. ' +
      'J. K. Rowling was not there. The talks ended at 4 p.m. local time. Dr. Lee said the next round, e.g. in March, matters.',
  );
  assert.deepEqual(s, [
    'Mr. Kim met U.S. officials in Washington, D.C. on Jan. 5 to discuss the 3.5 percent rise.',
    'J. K. Rowling was not there.',
    'The talks ended at 4 p.m. local time.',
    'Dr. Lee said the next round, e.g. in March, matters.',
  ]);
});

test('sentences ending in quotes, question/exclamation marks and CJK punctuation', () => {
  assert.deepEqual(splitSentences('그는 “끝났다.” 라고 말했다. 정말일까? 그렇다!'), ['그는 “끝났다.” 라고 말했다.', '정말일까?', '그렇다!']);
  assert.deepEqual(splitSentences('日本銀行は決定した。 市場は反応した。'), ['日本銀行は決定した。', '市場は反応した。']);
});

test('a single huge sentence without boundaries is left whole (never cut mid-sentence)', () => {
  const one = '쉼표로만 이어진 아주 긴 문장, '.repeat(40) + '끝';
  assert.deepEqual(reflowParagraph(one), [one.trim()]);
});

test('a tiny trailing sentence is merged into the previous paragraph', () => {
  const out = reflowParagraph(WALL + ' 끝.');
  assert.ok(out[out.length - 1].endsWith('끝.'));
  assert.ok(out[out.length - 1].length > 80);
});

// ── Integration points ────────────────────────────────────────────────────

test('RSS body HTML keeps its paragraphs (was collapsed into one block)', async () => {
  const { htmlToParagraphs } = await import('../src/workers/normalizer');
  const html = '<p>첫 문단입니다.</p>\n<p>두 번째&nbsp;문단입니다.<br>줄바꿈 뒤 문장.</p><div>세 번째 &amp; 마지막.</div>';
  assert.equal(htmlToParagraphs(html), '첫 문단입니다.\n두 번째 문단입니다.\n줄바꿈 뒤 문장.\n세 번째 & 마지막.');
  // a body that arrives as one long block is split at sentence ends
  const out = htmlToParagraphs(`<p>${WALL}</p>`).split('\n');
  assert.ok(out.length >= 3);
  assert.deepEqual(words(out.join(' ')), words(WALL));
});

test('article page splits an already-stored wall of text (no DB change, no re-translation)', async () => {
  const { getArticleView, splitParagraphs } = await import('../src/lib/article-view');
  assert.ok(splitParagraphs(WALL).length >= 3);
  const view = getArticleView({ titleOriginal: 'T', titleKo: '제목', language: 'en', contentKo: WALL, contentOriginal: 'x '.repeat(50) });
  assert.ok(view.bodyParagraphs.length >= 3);
  assert.deepEqual(words(view.bodyParagraphs.join(' ')), words(WALL));
});

test('a translation returned as one block is stored as paragraphs', async () => {
  const { translateLongText } = await import('../src/workers/content-translator');
  const client = {
    chat: { completions: { async create() { return { choices: [{ message: { content: WALL }, finish_reason: 'stop' }] }; } } },
  };
  const r = await translateLongText('The source has no paragraph breaks at all. '.repeat(10), { client, language: 'en', chunkPauseMs: 0 });
  assert.ok(r.ok);
  if (r.ok) {
    assert.ok(r.text.split('\n').length >= 3);
    assert.deepEqual(words(r.text), words(WALL));
  }
});
