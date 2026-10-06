/**
 * Unit tests for src/lib/article-view.ts (slice S4). Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getArticleView, languageLabel, splitParagraphs } from '../src/lib/article-view';

const base = {
  titleKo: '연준, 금리 동결',
  titleOriginal: 'Fed holds rates',
  language: 'en',
  summaryKo: '연준이 금리를 동결했다.',
  contentKo: '첫 문단\n\n둘째 문단',
  contentOriginal: 'First paragraph\nSecond paragraph',
};

test('bodyMode: all five modes', () => {
  assert.equal(getArticleView(base).bodyMode, 'translated');
  assert.equal(getArticleView({ ...base, contentKo: null }).bodyMode, 'summary+original');
  assert.equal(getArticleView({ ...base, contentKo: null, summaryKo: null }).bodyMode, 'original');
  assert.equal(getArticleView({ ...base, contentKo: null, contentOriginal: null }).bodyMode, 'summary');
  assert.equal(getArticleView({ ...base, contentKo: null, contentOriginal: null, summaryKo: null }).bodyMode, 'empty');
});

test('blank strings count as missing', () => {
  const v = getArticleView({ ...base, contentKo: '  \n ', summaryKo: '   ' });
  assert.equal(v.bodyMode, 'original');
  assert.equal(v.summary, null);
  assert.equal(v.bodyPending, true);
});

test('pending flags', () => {
  const ok = getArticleView(base);
  assert.equal(ok.titlePending, false);
  assert.equal(ok.bodyPending, false);
  assert.equal(ok.title.lang, 'ko');

  const untranslated = getArticleView({ ...base, contentKo: null });
  assert.equal(untranslated.bodyPending, true);
  assert.equal(untranslated.summary, '연준이 금리를 동결했다.');

  const nullTitle = getArticleView({ ...base, titleKo: null });
  assert.equal(nullTitle.titlePending, true);
  assert.equal(nullTitle.title.text, 'Fed holds rates');
  assert.equal(nullTitle.title.lang, 'en');

  const echo = getArticleView({ ...base, titleKo: ' Fed holds rates ' });
  assert.equal(echo.titlePending, true, 'echoed English titleKo is untranslated');
  assert.equal(echo.title.isTranslated, false);

  assert.equal(getArticleView({ ...base, contentKo: null, contentOriginal: null, summaryKo: null }).bodyPending, false, 'empty is not "pending"');
});

test('Korean-language articles are never pending', () => {
  const ko = getArticleView({ ...base, language: 'ko', titleKo: null, titleOriginal: '한국어 원제', contentKo: null });
  assert.equal(ko.titlePending, false);
  assert.equal(ko.bodyPending, false);
  assert.equal(ko.bodyMode, 'summary+original');
});

test('original language tag and label', () => {
  assert.equal(getArticleView({ ...base, language: 'ja' }).originalLang, 'ja');
  assert.equal(getArticleView({ ...base, language: 'ja' }).originalLabel, '日本語');
  assert.equal(getArticleView({ ...base, language: 'english' }).originalLang, undefined);
  assert.equal(getArticleView({ ...base, language: 'english' }).originalLabel, '원문');
});

test('paragraphs: split on newline, trimmed, blanks dropped', () => {
  assert.deepEqual(getArticleView(base).bodyParagraphs, ['첫 문단', '둘째 문단']);
  assert.deepEqual(getArticleView(base).originalParagraphs, ['First paragraph', 'Second paragraph']);
  assert.deepEqual(splitParagraphs('  a \n\n \n b\r\n'), ['a', 'b']);
  assert.deepEqual(splitParagraphs(null), []);
});

test('languageLabel table', () => {
  const cases: Array<[string | null | undefined, string]> = [
    ['en', 'English'], ['EN', 'English'], [' ja ', '日本語'], ['zh', '中文'], ['zh-CN', '中文'], ['ko', '한국어'],
    ['fr', '원문'], ['english', '원문'], ['', '원문'], [null, '원문'], [undefined, '원문'], ['constructor', '원문'],
  ];
  for (const [input, want] of cases) assert.equal(languageLabel(input), want, String(input));
});
