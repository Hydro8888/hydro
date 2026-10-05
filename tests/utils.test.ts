/**
 * Unit tests for src/lib/utils.ts (slice S1). Run: npm test
 * Pure functions only — no network, no DB. Tests that change process.env.TZ restore it.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORY_PHOTOS,
  formatDate,
  formatDateOnly,
  getArticleImageSources,
  getDefaultImage,
  getDisplayTitle,
  isValidArticleImage,
  normalizeImageUrl,
  parseIntParam,
  parsePage,
  proxyImageUrl,
  timeAgo,
  toIsoDateTime,
  toKstParts,
  toLangTag,
} from '../src/lib/utils';
import { CATEGORIES, IMAGE_PLACEHOLDER_SRC, MAX_PAGE } from '../src/lib/constants';

/** 2026-10-05 03:00:00 UTC = 2026-10-05 12:00 KST */
const NOW = Date.UTC(2026, 9, 5, 3, 0, 0);
const SEC = 1000;
const INVALID_DATES = [null, undefined, '', '   ', 'garbage', new Date(NaN), NaN, Infinity, '2026-02-30T00:00:00Z'];

/** Runs fn with process.env.TZ set to tz, then restores the original value. */
function withTZ<T>(tz: string, fn: () => T): T {
  const original = process.env.TZ;
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
}

/** Deterministic PRNG (mulberry32) so the fuzz cases are reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// D7 — dates
// ---------------------------------------------------------------------------

describe('formatDate (KST, 24h, YYYY.MM.DD HH:mm)', () => {
  test('same instant in every input form → 2026.10.01 17:03', () => {
    assert.equal(formatDate('2026-10-01T08:03:00Z'), '2026.10.01 17:03');
    assert.equal(formatDate(new Date('2026-10-01T08:03:00Z')), '2026.10.01 17:03');
    assert.equal(formatDate(Date.UTC(2026, 9, 1, 8, 3)), '2026.10.01 17:03');
    assert.equal(formatDate('2026-10-01T17:03:00+09:00'), '2026.10.01 17:03');
  });

  test('date-time string without a zone is read as UTC', () => {
    assert.equal(formatDate('2026-10-01T08:03:00'), '2026.10.01 17:03');
    assert.equal(formatDate('2026-10-01 08:03'), '2026.10.01 17:03');
  });

  test('day / month / year rollover and leap years', () => {
    assert.equal(formatDate('2026-12-31T15:00:00Z'), '2027.01.01 00:00');
    assert.equal(formatDate('2026-12-31T14:59:59Z'), '2026.12.31 23:59');
    assert.equal(formatDate('2028-02-28T15:30:00Z'), '2028.02.29 00:30');
    assert.equal(formatDate('2026-02-28T15:30:00Z'), '2026.03.01 00:30');
  });

  test('invalid input → empty string (never "Invalid Date")', () => {
    for (const bad of INVALID_DATES) assert.equal(formatDate(bad), '', `input ${String(bad)}`);
  });

  test('no AM/PM or locale artefacts', () => {
    assert.match(formatDate('2026-10-01T15:00:00Z'), /^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/);
    assert.equal(formatDate('2026-10-01T15:00:00Z'), '2026.10.02 00:00');
  });
});

describe('formatDateOnly', () => {
  test('KST calendar date', () => {
    assert.equal(formatDateOnly('2026-09-30T15:00:00Z'), '2026.10.01');
    assert.equal(formatDateOnly('2026-09-30T14:59:59Z'), '2026.09.30');
  });
  test('invalid input → empty string', () => {
    for (const bad of INVALID_DATES) assert.equal(formatDateOnly(bad), '', `input ${String(bad)}`);
  });
});

describe('toIsoDateTime / toKstParts', () => {
  test('toIsoDateTime returns UTC ISO-8601', () => {
    assert.equal(toIsoDateTime('2026-10-01T17:03:00+09:00'), '2026-10-01T08:03:00.000Z');
    assert.equal(toIsoDateTime(new Date('2026-10-01T08:03:00Z')), '2026-10-01T08:03:00.000Z');
    assert.equal(toIsoDateTime('2026-10-01T08:03:00'), '2026-10-01T08:03:00.000Z');
  });
  test('toKstParts returns KST fields (weekday 0 = Sunday)', () => {
    assert.deepEqual(toKstParts('2026-10-04T15:30:00Z'), {
      year: 2026, month: 10, day: 5, hour: 0, minute: 30, second: 0, weekday: 1,
    });
  });
  test('invalid input → undefined / null', () => {
    for (const bad of INVALID_DATES) {
      assert.equal(toIsoDateTime(bad), undefined, `input ${String(bad)}`);
      assert.equal(toKstParts(bad), null, `input ${String(bad)}`);
    }
  });
});

describe('timeAgo(t, NOW)', () => {
  const ago = (seconds: number) => timeAgo(NOW - seconds * SEC, NOW);

  test('relative buckets and their boundaries', () => {
    assert.equal(timeAgo(NOW, NOW), '방금 전');
    assert.equal(ago(59), '방금 전');
    assert.equal(ago(60), '1분 전');
    assert.equal(ago(3599), '59분 전');
    assert.equal(ago(3600), '1시간 전');
    assert.equal(ago(86399), '23시간 전');
    assert.equal(ago(86400), '1일 전');
    assert.equal(ago(604799), '6일 전');
  });

  test('7 days or more → KST date', () => {
    assert.equal(ago(604800), '2026.09.28');
    assert.equal(timeAgo('2026-09-01T20:30:00Z', NOW), '2026.09.02');
  });

  test('future: ±60s clock skew reads 방금 전, further ahead shows the absolute time', () => {
    assert.equal(ago(-30), '방금 전');
    assert.equal(ago(-60), '방금 전');
    assert.equal(ago(-61), formatDate(NOW + 61 * SEC));
    assert.equal(timeAgo(NOW + 5 * 3600 * SEC, NOW), '2026.10.05 17:00');
  });

  test('invalid input → empty string', () => {
    for (const bad of INVALID_DATES) assert.equal(timeAgo(bad, NOW), '', `input ${String(bad)}`);
  });

  test('now accepts a Date as well as a number; default is the current time', () => {
    assert.equal(timeAgo(NOW - 3600 * SEC, new Date(NOW)), timeAgo(NOW - 3600 * SEC, NOW));
    assert.equal(timeAgo(new Date(NOW - 7200 * SEC), new Date(NOW)), '2시간 전');
    assert.equal(timeAgo(new Date(Date.now() - 5 * 60 * SEC)), '5분 전');
  });
});

describe('date output does not depend on the process time zone', () => {
  const ZONES = ['UTC', 'Asia/Seoul', 'America/Los_Angeles', 'Pacific/Kiritimati'];
  const INPUTS = ['2026-10-01T08:03:00Z', '2026-10-01T08:03:00', '2026-12-31T15:00:00Z', '2026-09-01T20:30:00Z'];
  const snapshot = () =>
    INPUTS.map((d) => [formatDate(d), formatDateOnly(d), timeAgo(d, NOW), toIsoDateTime(d)].join(' | '))
      .concat([timeAgo(NOW - 3 * 3600 * SEC, NOW), timeAgo(NOW + 5 * 3600 * SEC, NOW)]);

  test('the TZ switch is effective in this runtime (sanity check)', () => {
    const utcHour = withTZ('UTC', () => new Date(Date.UTC(2026, 9, 1, 8, 3)).getHours());
    const seoulHour = withTZ('Asia/Seoul', () => new Date(Date.UTC(2026, 9, 1, 8, 3)).getHours());
    assert.equal(utcHour, 8);
    assert.equal(seoulHour, 17);
  });

  test('identical results in UTC, Asia/Seoul, America/Los_Angeles, Pacific/Kiritimati', () => {
    const expected = withTZ('UTC', snapshot);
    assert.equal(expected[0], '2026.10.01 17:03 | 2026.10.01 | 3일 전 | 2026-10-01T08:03:00.000Z');
    assert.equal(expected[3], '2026.09.02 05:30 | 2026.09.02 | 2026.09.02 | 2026-09-01T20:30:00.000Z');
    for (const tz of ZONES) assert.deepEqual(withTZ(tz, snapshot), expected, `TZ=${tz}`);
  });
});

// ---------------------------------------------------------------------------
// D8 — query-string integers
// ---------------------------------------------------------------------------

describe('parsePage', () => {
  test('unparseable input → 1', () => {
    const cases: unknown[] = [undefined, null, '', 'abc', '7abc', '-3', '2.5', '1e3', '０７', [], {}, 2.5, NaN, Infinity, -Infinity, true];
    for (const raw of cases) assert.equal(parsePage(raw), 1, `input ${JSON.stringify(raw)}`);
  });

  test('ASCII digit strings and integers', () => {
    assert.equal(parsePage('1'), 1);
    assert.equal(parsePage('7'), 7);
    assert.equal(parsePage(' 7 '), 7);
    assert.equal(parsePage('007'), 7);
    assert.equal(parsePage(7), 7);
  });

  test('clamped to 1..MAX_PAGE', () => {
    assert.equal(parsePage('0'), 1);
    assert.equal(parsePage(-5), 1);
    assert.equal(parsePage(String(MAX_PAGE)), MAX_PAGE);
    assert.equal(parsePage(String(MAX_PAGE + 1)), MAX_PAGE);
    assert.equal(parsePage('99999999999999999999'), MAX_PAGE);
    assert.equal(parsePage('9'.repeat(400)), MAX_PAGE); // Number() → Infinity
  });

  test('repeated parameter (?page=3&page=9) → first value', () => {
    assert.equal(parsePage(['3', '9']), 3);
    assert.equal(parsePage(['abc', '9']), 1);
  });

  test('fuzz: 1,000 random strings/numbers always give an integer in 1..MAX_PAGE', () => {
    const rand = mulberry32(20261005);
    const alphabet = '0123456789012345678901234567890123456789 -+.,eExXabc%&=?０１２３４５６７８９\t\n 　';
    for (let i = 0; i < 1000; i++) {
      let raw: unknown;
      const kind = i % 4;
      if (kind === 3) {
        raw = (rand() - 0.5) * 10 ** Math.floor(rand() * 25);
      } else {
        const len = Math.floor(rand() * 25);
        let s = '';
        for (let j = 0; j < len; j++) s += alphabet[Math.floor(rand() * alphabet.length)];
        raw = kind === 2 ? [s, 'x'] : s;
      }
      const page = parsePage(raw);
      assert.ok(Number.isInteger(page) && page >= 1 && page <= MAX_PAGE, `input ${JSON.stringify(raw)} → ${page}`);
    }
  });
});

describe('parseIntParam', () => {
  const LIMIT = { min: 1, max: 100, fallback: 20 };
  test('fallback / clamp / pass-through', () => {
    assert.equal(parseIntParam('abc', LIMIT), 20);
    assert.equal(parseIntParam(undefined, LIMIT), 20);
    assert.equal(parseIntParam('0', LIMIT), 1);
    assert.equal(parseIntParam('500', LIMIT), 100);
    assert.equal(parseIntParam('50', LIMIT), 50);
  });
});

// ---------------------------------------------------------------------------
// D1 — Unsplash fallback photos
// ---------------------------------------------------------------------------

const DEAD_PHOTO_IDS = [
  'photo-1535320903710-d946a44237ab',
  'photo-1461896836934-bd45ba43fcee',
  'photo-1640955014216-7d4be39b5f94',
  'photo-1549317661-bd32c8ce0abe',
  'photo-1499781350541-7783f6c6a0c8',
  'photo-1504711434969-e33886168d4c',
];

describe('CATEGORY_PHOTOS (D1)', () => {
  test('none of the six 404 photo IDs remain', () => {
    const all = Object.values(CATEGORY_PHOTOS).flat();
    for (const dead of DEAD_PHOTO_IDS) assert.ok(!all.includes(dead), `${dead} still present`);
  });

  test('replacements sit in the exact slots of the removed IDs', () => {
    assert.equal(CATEGORY_PHOTOS.market[1], 'photo-1640340434855-6084b1f4901c');
    assert.equal(CATEGORY_PHOTOS.sports[0], 'photo-1471295253337-3ceaaedca402');
    assert.equal(CATEGORY_PHOTOS.semiconductor[2], 'photo-1591799264318-7e6ef8ddb7ea');
    assert.equal(CATEGORY_PHOTOS.automotive[2], 'photo-1494976388531-d1058494cdd8');
    assert.equal(CATEGORY_PHOTOS.culture[2], 'photo-1460661419201-fd4cecdf8a8b');
    assert.equal(CATEGORY_PHOTOS.general[0], 'photo-1504711331083-9c895941bf81');
  });

  test('every category slug has 4 well-formed photo IDs', () => {
    assert.equal(CATEGORIES.length, 16);
    for (const { slug } of CATEGORIES) {
      const photos = CATEGORY_PHOTOS[slug];
      assert.ok(photos, `missing photos for ${slug}`);
      assert.equal(photos.length, 4, slug);
      for (const id of photos) assert.match(id, /^photo-\d+-[0-9a-f]+$/, `${slug}: ${id}`);
    }
  });
});

describe('getDefaultImage', () => {
  const URL_RE = /^https:\/\/images\.unsplash\.com\/photo-\d+-[0-9a-f]+\?w=800&h=500&fit=crop&auto=format&q=75$/;

  test('always a valid Unsplash URL, whatever the id', () => {
    const ids: Array<number | string | null | undefined> = [0, 1, 2, 3, 5, -1, NaN, 1.5, '12', 'abc', null, undefined, Number.MAX_SAFE_INTEGER, Infinity, -7.9, ''];
    for (const cat of ['sports', 'general', null, 'nope']) {
      for (const id of ids) {
        const url = getDefaultImage(cat, id);
        assert.match(url, URL_RE, `(${cat}, ${String(id)})`);
        assert.ok(!url.includes('undefined'), `(${cat}, ${String(id)})`);
      }
    }
  });

  test('positive integer ids keep their historical slot (id % 4)', () => {
    assert.equal(getDefaultImage('economy', 5), `https://images.unsplash.com/${CATEGORY_PHOTOS.economy[1]}?w=800&h=500&fit=crop&auto=format&q=75`);
    for (const { slug } of CATEGORIES) {
      for (let id = 0; id < 12; id++) {
        assert.ok(getDefaultImage(slug, id).includes(`/${CATEGORY_PHOTOS[slug][id % 4]}?`), `${slug} #${id}`);
        assert.equal(getDefaultImage(slug, String(id)), getDefaultImage(slug, id), `${slug} '${id}'`);
      }
    }
  });

  test('category is trimmed / lower-cased; unknown or missing → general', () => {
    assert.equal(getDefaultImage(' Sports ', 1), getDefaultImage('sports', 1));
    assert.equal(getDefaultImage(null, 1), getDefaultImage('general', 1));
    assert.equal(getDefaultImage('quantum-weird-category', 1), getDefaultImage('general', 1));
    assert.equal(getDefaultImage(undefined, 1), getDefaultImage('general', 1));
    for (const protoKey of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
      assert.equal(getDefaultImage(protoKey, 1), getDefaultImage('general', 1), protoKey);
    }
  });

  test('deterministic: same input → same output', () => {
    assert.equal(getDefaultImage('market', 42), getDefaultImage('market', 42));
    assert.equal(getDefaultImage('market', -42), getDefaultImage('market', 42));
  });
});

// ---------------------------------------------------------------------------
// D2/D3 base — image candidate chain
// ---------------------------------------------------------------------------

describe('getArticleImageSources', () => {
  test('valid original → [proxied original, Unsplash fallback, placeholder]', () => {
    const article = { id: 7, imageUrl: 'https://cdn.example.com/news/2026/photo.jpg', categoryPrimary: 'economy' };
    assert.deepEqual(getArticleImageSources(article), [
      proxyImageUrl(normalizeImageUrl(article.imageUrl)!),
      getDefaultImage('economy', 7),
      IMAGE_PLACEHOLDER_SRC,
    ]);
  });

  test('missing / logo / non-http original → [Unsplash fallback, placeholder]', () => {
    for (const imageUrl of [null, undefined, '', 'https://static.example.com/assets/logo.png', 'javascript:alert(1)']) {
      const sources = getArticleImageSources({ id: 3, imageUrl, categoryPrimary: 'sports' });
      assert.deepEqual(sources, [getDefaultImage('sports', 3), IMAGE_PLACEHOLDER_SRC], `imageUrl ${String(imageUrl)}`);
    }
  });

  test('protocol-relative and http originals are proxied as https', () => {
    const rel = getArticleImageSources({ id: 1, imageUrl: '//cdn.example.com/photos/abc.jpg', categoryPrimary: null });
    assert.equal(rel[0], proxyImageUrl('https://cdn.example.com/photos/abc.jpg'));
    assert.equal(rel[0], '/livenews/api/img?url=' + encodeURIComponent('https://cdn.example.com/photos/abc.jpg'));
    const http = getArticleImageSources({ id: 1, imageUrl: 'http://x.com/a.jpg' });
    assert.equal(http[0], '/livenews/api/img?url=' + encodeURIComponent('https://x.com/a.jpg'));
  });

  test('last entry is always the placeholder, no duplicates, deterministic', () => {
    const articles = [
      { id: 1, imageUrl: 'https://cdn.example.com/a.jpg', categoryPrimary: 'culture' },
      { id: '12', imageUrl: null, categoryPrimary: null },
      { id: -1, imageUrl: 'ftp://files.example.com/a.jpg', categoryPrimary: 'unknown' },
    ];
    for (const a of articles) {
      const sources = getArticleImageSources(a);
      assert.ok(sources.length >= 2 && sources.length <= 3);
      assert.equal(sources[sources.length - 1], IMAGE_PLACEHOLDER_SRC);
      assert.equal(new Set(sources).size, sources.length);
      assert.deepEqual(getArticleImageSources(a), sources);
    }
  });
});

// ---------------------------------------------------------------------------
// S1-C — image URL helpers
// ---------------------------------------------------------------------------

describe('isValidArticleImage', () => {
  test('accepts real http(s) article images', () => {
    assert.equal(isValidArticleImage('https://cdn.example.com/news/2026/photo.jpg'), true);
    assert.equal(isValidArticleImage('http://cdn.example.com/a.jpg'), true);
  });

  test('rejects empty, logos, non-http schemes, blocked domains, relative URLs and the placeholder', () => {
    const rejected = [
      null,
      undefined,
      '',
      'short',
      'https://static.example.com/assets/logo.png',
      'https://www.example.com/favicon.ico',
      'https://cdn.example.com/images/mark.svg',
      'data:image/png;base64,iVBORw0KGgo=',
      'javascript:alert(document.cookie)',
      'ftp://files.example.com/a.jpg',
      'https://static.chinadaily.com.cn/img/a.jpg',
      '/relative/a.jpg',
      IMAGE_PLACEHOLDER_SRC,
    ];
    for (const url of rejected) assert.equal(isValidArticleImage(url), false, String(url).slice(0, 60));
  });
});

describe('normalizeImageUrl (regression)', () => {
  test('protocol-relative and http are upgraded to https; whitespace trimmed; empty → null', () => {
    assert.equal(normalizeImageUrl('//x.com/a.jpg'), 'https://x.com/a.jpg');
    assert.equal(normalizeImageUrl('http://x.com/a.jpg'), 'https://x.com/a.jpg');
    assert.equal(normalizeImageUrl('  https://x.com/a.jpg \n'), 'https://x.com/a.jpg');
    assert.equal(normalizeImageUrl(null), null);
    assert.equal(normalizeImageUrl(''), null);
  });
});

describe('proxyImageUrl', () => {
  test('external URLs go through /livenews/api/img, URL-encoded', () => {
    assert.equal(proxyImageUrl('https://x.com/a b.jpg'), '/livenews/api/img?url=https%3A%2F%2Fx.com%2Fa%20b.jpg');
  });
  test('same-origin paths, data URIs and empty strings pass through', () => {
    assert.equal(proxyImageUrl('/local.png'), '/local.png');
    assert.equal(proxyImageUrl('data:image/png;base64,AA'), 'data:image/png;base64,AA');
    assert.equal(proxyImageUrl(''), '');
  });
  test('protocol-relative URLs are proxied as https', () => {
    assert.equal(proxyImageUrl('//cdn.example.com/a.jpg'), '/livenews/api/img?url=' + encodeURIComponent('https://cdn.example.com/a.jpg'));
  });
});

// ---------------------------------------------------------------------------
// D6 follow-up — display title & lang tags
// ---------------------------------------------------------------------------

describe('getDisplayTitle', () => {
  test('translated Korean title wins', () => {
    assert.deepEqual(
      getDisplayTitle({ titleKo: '미 연준 금리 인하 신호', titleOriginal: 'Fed signals rate cuts', language: 'en' }),
      { text: '미 연준 금리 인하 신호', lang: 'ko', isTranslated: true },
    );
    assert.deepEqual(getDisplayTitle({ titleKo: '번역', titleOriginal: 'orig' }), { text: '번역', lang: 'ko', isTranslated: true });
  });

  test('untranslated title falls back to the original with its language', () => {
    assert.deepEqual(
      getDisplayTitle({ titleKo: null, titleOriginal: '日本銀行、…', language: 'ja' }),
      { text: '日本銀行、…', lang: 'ja', isTranslated: false },
    );
    assert.deepEqual(getDisplayTitle({ titleKo: null, titleOriginal: 'orig' }), { text: 'orig', lang: undefined, isTranslated: false });
  });

  test('echoed (identical) or blank titleKo counts as untranslated', () => {
    assert.deepEqual(
      getDisplayTitle({ titleKo: 'Fed signals', titleOriginal: 'Fed signals', language: 'en' }),
      { text: 'Fed signals', lang: 'en', isTranslated: false },
    );
    assert.deepEqual(getDisplayTitle({ titleKo: '   ', titleOriginal: 'X', language: 'en' }), { text: 'X', lang: 'en', isTranslated: false });
  });
});

describe('toLangTag', () => {
  test('normalizes valid tags, rejects the rest', () => {
    assert.equal(toLangTag('ja'), 'ja');
    assert.equal(toLangTag(' ZH '), 'zh');
    assert.equal(toLangTag('zh-CN'), 'zh-cn');
    assert.equal(toLangTag(''), undefined);
    assert.equal(toLangTag(null), undefined);
    assert.equal(toLangTag(undefined), undefined);
    assert.equal(toLangTag('english'), undefined);
  });
});
