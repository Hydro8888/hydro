/**
 * Unit tests for src/lib/headline.ts — the size rule of the home lead headline (slice S3). Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { LEAD_HEADLINE_CLASS, headlineUnits, leadHeadlineTier } from '../src/lib/headline';

test('headlineUnits: Hangul and CJK count 1, spaces 0.3, Latin / digits / punctuation 0.55', () => {
  assert.equal(headlineUnits('치세케디, 헌법 개정의 길 열어'), 13.75);
  assert.equal(headlineUnits('러시아와 우크라이나, 평화 회담 종료 후 대규모 포로 교환에 합의'), 29.25);
  assert.equal(headlineUnits('프랑스 학생들이 시위 압박을 이어가겠다고 다짐한 가운데 학교에서 폭력 사건 발생'), 37);
  assert.equal(headlineUnits('Brazil electoral court fines Meta $1.3 million but finds no deliberate election bias at all'), 46.55);
  assert.equal(headlineUnits('東京で新しい国際会議が開幕'), 13);
  // surrounding whitespace does not count
  assert.equal(headlineUnits('  가나  '), 2);
});

test('headlineUnits: blank and missing titles are 0', () => {
  for (const blank of ['', '   ', null, undefined]) {
    assert.equal(headlineUnits(blank), 0, JSON.stringify(blank));
    assert.equal(leadHeadlineTier(blank), 'short', JSON.stringify(blank));
  }
});

test('leadHeadlineTier: real titles', () => {
  assert.equal(leadHeadlineTier('러시아와 우크라이나, 평화 회담 종료 후 대규모 포로 교환에 합의'), 'short');
  assert.equal(leadHeadlineTier('프랑스 학생들이 시위 압박을 이어가겠다고 다짐한 가운데 학교에서 폭력 사건 발생'), 'medium');
  assert.equal(leadHeadlineTier('Brazil electoral court fines Meta $1.3 million but finds no deliberate election bias at all'), 'medium');
  // QA fixture 391: a title of more than 200 characters
  const longTitle = '초장문 제목 테스트: ' + '대한민국 수출입 동향과 글로벌 공급망 재편에 따른 반도체·자동차·배터리 산업의 구조적 변화 전망 '.repeat(4);
  assert.equal(leadHeadlineTier(longTitle), 'long');
});

test('leadHeadlineTier: boundaries at 30 and 50 units', () => {
  const hangul = (n: number) => '가'.repeat(n);
  assert.equal(leadHeadlineTier(hangul(30)), 'short'); // 30
  assert.equal(leadHeadlineTier(`${hangul(29)} 가`), 'medium'); // 30.3
  assert.equal(leadHeadlineTier(hangul(50)), 'medium'); // 50
  assert.equal(leadHeadlineTier(`${hangul(49)} 가`), 'long'); // 50.3
});

test('LEAD_HEADLINE_CLASS: complete class names in the source (Tailwind scans src/lib as text)', () => {
  const src = fs.readFileSync(path.resolve(__dirname, '../src/lib/headline.ts'), 'utf8');
  assert.deepEqual(Object.keys(LEAD_HEADLINE_CLASS).sort(), ['long', 'medium', 'short']);
  for (const value of Object.values(LEAD_HEADLINE_CLASS)) {
    assert.ok(src.includes(`'${value}'`), `'${value}' is a quoted literal`);
    assert.match(value, /^[a-z:\- ]+$/, 'no interpolation, no arbitrary values');
  }
});

test('LEAD_HEADLINE_CLASS: weight 600 at every size, 20px below 640px unless the title is short', () => {
  // headline-xl carries 600 in its token; headline-md / headline-lg carry 500 and need the explicit weight.
  assert.equal(LEAD_HEADLINE_CLASS.short, 'text-headline-xl');
  assert.equal(LEAD_HEADLINE_CLASS.medium, 'text-headline-md font-semibold sm:text-headline-xl');
  assert.equal(LEAD_HEADLINE_CLASS.long, 'text-headline-md font-semibold sm:text-headline-lg sm:font-semibold');
});
