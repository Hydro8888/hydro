/**
 * Unit tests for src/workers/translation-text.ts (slice S5). Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES } from '../src/lib/constants';
import {
  countParagraphs,
  hasHangul,
  isKoreanLanguage,
  isMissingSummary,
  isTruncatedTranslation,
  isUntranslatedContent,
  isUntranslatedTitle,
  normalizeCategorySlug,
  normalizeLanguageTag,
  normalizeSecondaryCategory,
  salvageTitleItems,
  splitForTranslation,
} from '../src/workers/translation-text';

const EN_PARA = [
  'The Federal Reserve said in a statement on Wednesday that inflation was cooling faster than many economists had predicted, opening the door to rate cuts later this year.',
  'Market analysts said the decision could mark a turning point for the broader economy, although risks remain elevated across several sectors.',
  'Officials said further measures would be announced in the coming weeks as negotiations continue with industry stakeholders.',
  'Supply chains are expected to keep shifting as companies diversify production away from single-country dependence.',
];
const body = (n: number) => Array.from({ length: n }, (_, i) => EN_PARA[i % EN_PARA.length]).join('\n');
const noWs = (s: string) => s.replace(/\s+/g, '');

/** Re-assemble chunks the way the translator does (identity "translation"). */
function assemble(chunks: ReturnType<typeof splitForTranslation>): string {
  let out = '';
  for (const c of chunks) out += (out ? c.joinWith : '') + c.text;
  return out;
}

// ── chunking ────────────────────────────────────────────────────────────────

test('splitForTranslation: 8000-char / 60-paragraph body', () => {
  const text = body(60);
  assert.ok(text.length > 8000);
  const chunks = splitForTranslation(text, 3000);
  assert.ok(chunks.length >= 3, `chunks=${chunks.length}`);
  for (const c of chunks) {
    assert.ok(c.text.length <= 3000, `chunk ${c.text.length}`);
    assert.ok(c.text.trim().length > 0);
    assert.equal(c.fragment, false);
  }
  assert.equal(chunks.reduce((n, c) => n + countParagraphs(c.text), 0), 60);
  assert.equal(noWs(chunks.map((c) => c.text).join('')), noWs(text));
  assert.equal(countParagraphs(assemble(chunks)), 60);
});

test('splitForTranslation: one 4000-char paragraph splits at sentence boundaries', () => {
  const p = Array.from({ length: 30 }, (_, i) => `Sentence number ${i} explains the policy shift in some detail here.`).join(' ');
  const text = (p + ' ' + p).slice(0, 4000).trim() + '.';
  assert.ok(!text.includes('\n'));
  const chunks = splitForTranslation(text, 3000);
  assert.ok(chunks.length >= 2);
  chunks.forEach((c, i) => {
    assert.ok(c.text.length <= 3000);
    assert.equal(c.fragment, true);
    assert.equal(c.joinWith, i === 0 ? '\n' : ' ');
  });
  // every fragment except the last ends at a sentence end
  for (const c of chunks.slice(0, -1)) assert.match(c.text, /[.!?]$/);
  assert.equal(noWs(chunks.map((c) => c.text).join('')), noWs(text));
  assert.equal(countParagraphs(assemble(chunks)), 1);
});

test('splitForTranslation: a 3500-char sentence is cut ≤ maxChars (space, else hard)', () => {
  const words = Array.from({ length: 700 }, () => 'word').join(' '); // 3499 chars, no punctuation
  const chunks = splitForTranslation(words, 3000);
  assert.ok(chunks.length >= 2);
  for (const c of chunks) assert.ok(c.text.length <= 3000);
  assert.equal(noWs(chunks.map((c) => c.text).join('')), noWs(words));

  const solid = 'x'.repeat(3500);
  const hard = splitForTranslation(solid, 3000);
  assert.deepEqual(hard.map((c) => c.text.length), [3000, 500]);
});

test('splitForTranslation: CJK sentence ends, mixed paragraphs, empty input', () => {
  const ja = '日本銀行は金融政策決定会合で、現状の金融緩和策を維持することを決めた。'.repeat(20);
  const chunks = splitForTranslation(ja, 200);
  for (const c of chunks) assert.ok(c.text.length <= 200);
  assert.equal(chunks.map((c) => c.text).join(''), ja);

  assert.deepEqual(splitForTranslation('', 3000), []);
  assert.deepEqual(splitForTranslation('\n \n\n', 3000), []);
  const mixed = splitForTranslation(`short one\n${'y'.repeat(50)}\nshort two`, 20);
  assert.ok(mixed.every((c) => c.text.length <= 20 && c.text.length > 0));
});

// ── echo / untranslated predicates (mirror of translation-coverage SQL) ─────

test('isUntranslatedTitle truth table', () => {
  const orig = 'Fed holds rates';
  const cases: Array<[string | null, string, string, boolean]> = [
    [null, orig, 'en', true],
    ['', orig, 'en', true],
    ['   ', orig, 'en', true],
    ['Fed holds rates steady', orig, 'en', true], // English → no Hangul
    [' Fed holds rates ', orig, 'en', true], // echo (trim-equal)
    ['연준, 금리 동결', orig, 'en', false],
    ['日本銀行、現状維持', '日本銀行、現状維持を決定', 'ja', true], // Japanese has no Hangul
    ['Fed holds rates', orig, 'ko', false], // Korean source: any non-blank title is the title
    ['', orig, 'ko', true],
    [null, orig, 'ko', true],
    ['연준', orig, 'EN-us', false],
    ['Fed', orig, null as unknown as string, true],
  ];
  for (const [ko, o, lang, want] of cases) {
    assert.equal(isUntranslatedTitle(ko, o, lang), want, JSON.stringify([ko, lang]));
  }
});

test('isUntranslatedContent / isMissingSummary', () => {
  const long = 'x'.repeat(31);
  assert.equal(isUntranslatedContent(null, 'short', 'en'), false, '≤ 30 chars is not a target');
  assert.equal(isUntranslatedContent(null, 'x'.repeat(30), 'en'), false);
  assert.equal(isUntranslatedContent(null, long, 'en'), true);
  assert.equal(isUntranslatedContent('  ', long, 'en'), true);
  assert.equal(isUntranslatedContent('English echo', long, 'en'), true);
  assert.equal(isUntranslatedContent('번역된 본문', long, 'en'), false);
  assert.equal(isUntranslatedContent('English body', long, 'ko'), false);
  assert.equal(isUntranslatedContent(null, long, 'ko'), true);

  assert.equal(isMissingSummary(null, 'en'), true);
  assert.equal(isMissingSummary('An English summary', 'en'), true);
  assert.equal(isMissingSummary('요약', 'en'), false);
  assert.equal(isMissingSummary(null, 'ko'), false);
});

test('isTruncatedTranslation / countParagraphs', () => {
  assert.equal(countParagraphs('a\n\n b \n  \nc'), 3);
  assert.equal(countParagraphs(''), 0);
  assert.equal(countParagraphs(null), 0);
  const orig = body(60); // > 6000 chars, 60 paragraphs
  const ko12 = Array.from({ length: 12 }, () => '번역 문단').join('\n');
  const ko60 = Array.from({ length: 60 }, () => '번역 문단').join('\n');
  assert.equal(isTruncatedTranslation(ko12, orig), true);
  assert.equal(isTruncatedTranslation(ko60, orig), false, 'repaired → not selected again');
  assert.equal(isTruncatedTranslation(ko12, body(6)), false, 'short originals were never cut');
  assert.equal(isTruncatedTranslation(null, orig), false);
  assert.equal(isTruncatedTranslation('English only', orig), false);
});

test('hasHangul / isKoreanLanguage', () => {
  assert.equal(hasHangul('abc'), false);
  assert.equal(hasHangul('a가'), true);
  assert.equal(hasHangul(null), false);
  assert.equal(isKoreanLanguage('ko'), true);
  assert.equal(isKoreanLanguage('KO-kr'), true);
  assert.equal(isKoreanLanguage('korean'), true);
  assert.equal(isKoreanLanguage('en'), false);
});

// ── JSON salvage ────────────────────────────────────────────────────────────

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    idx: i + 1,
    titleKo: `한국어 제목 ${i + 1}`,
    summaryKo: `요약 ${i + 1}`,
    primary: 'world',
    secondary: '',
  }));

test('salvageTitleItems: complete array, code fence', () => {
  const full = JSON.stringify(items(3));
  assert.equal(salvageTitleItems(full).length, 3);
  const fenced = '```json\n' + full + '\n```';
  const got = salvageTitleItems(fenced);
  assert.equal(got.length, 3);
  assert.deepEqual(got[1], { idx: 2, titleKo: '한국어 제목 2', summaryKo: '요약 2', primary: 'world', secondary: '' });
});

test('salvageTitleItems: array cut at 60% keeps every complete field', () => {
  const full = JSON.stringify(items(10));
  const cut = '```json\n' + full.slice(0, Math.floor(full.length * 0.6));
  const got = salvageTitleItems(cut);
  assert.ok(got.length >= 5 && got.length <= 7, `got ${got.length}`);
  got.forEach((it, i) => assert.equal(it.idx, i + 1));
  for (const it of got.slice(0, -1)) assert.ok(it.titleKo && it.summaryKo);
});

test('salvageTitleItems: single object cut inside the summary / inside the title', () => {
  const a = salvageTitleItems('[{"idx":1,"titleKo":"한국어 제목: X","summaryKo":"요약');
  assert.deepEqual(a, [{ idx: 1, titleKo: '한국어 제목: X' }]);
  const b = salvageTitleItems('[{"idx":1,"titleKo":"한국어 제');
  assert.deepEqual(b, [{ idx: 1 }]);
  const c = salvageTitleItems('[{"idx":1');
  assert.deepEqual(c, [], 'a number at the very end may be cut short');
});

test('salvageTitleItems: escaped quotes and unicode escapes', () => {
  const raw = '[{"idx":1,"titleKo":"\\"따옴표\\" 제목 \\uD55C","summaryKo":"줄\\n바꿈"},{"idx":2,"titleKo":"둘\\"';
  const got = salvageTitleItems(raw);
  assert.equal(got[0].titleKo, '"따옴표" 제목 한');
  assert.equal(got[0].summaryKo, '줄\n바꿈');
  assert.deepEqual(got[1], { idx: 2 });
});

test('salvageTitleItems: garbage never throws', () => {
  for (const raw of ['', 'no json here', '[', '{', '[{]', '}}}{{{', '```', '[1,2,3]', 'null', undefined, 42, '[{"idx":"x"}]']) {
    assert.doesNotThrow(() => salvageTitleItems(raw as string));
  }
  assert.deepEqual(salvageTitleItems('no json here'), []);
  assert.deepEqual(salvageTitleItems('[1,2,3]'), []);
});

// ── category / language normalization ───────────────────────────────────────

test('normalizeCategorySlug / normalizeSecondaryCategory', () => {
  assert.equal(normalizeCategorySlug('Technology'), 'general');
  assert.equal(normalizeCategorySlug('tech'), 'general');
  assert.equal(normalizeCategorySlug('AI_Tech'), 'ai-tech');
  assert.equal(normalizeCategorySlug(' AI Tech '), 'ai-tech');
  assert.equal(normalizeCategorySlug('ECONOMY'), 'economy');
  assert.equal(normalizeCategorySlug('quantum-weird-category'), 'general');
  assert.equal(normalizeCategorySlug(undefined), 'general');
  assert.equal(normalizeCategorySlug(42), 'general');
  for (const c of CATEGORIES) assert.equal(normalizeCategorySlug(c.slug), c.slug);
  assert.equal(CATEGORIES.length, 16);
  assert.equal(normalizeSecondaryCategory('Sports'), 'sports');
  assert.equal(normalizeSecondaryCategory('opinion'), '');
  assert.equal(normalizeSecondaryCategory(''), '');
});

test('normalizeLanguageTag', () => {
  const cases: Array<[unknown, string]> = [
    ['en', 'en'],
    ['EN', 'en'],
    ['en-US', 'en'],
    ['EN-us', 'en'],
    ['ja_JP', 'ja'],
    ['zh-Hans-CN', 'zh'],
    ['english', 'en'],
    ['Japanese', 'ja'],
    ['chinese', 'zh'],
    ['korean', 'ko'],
    ['ko', 'ko'],
    ['', 'en'],
    ['   ', 'en'],
    [null, 'en'],
    [undefined, 'en'],
  ];
  for (const [raw, want] of cases) assert.equal(normalizeLanguageTag(raw), want, String(raw));
});
