// Static checks for the S4 pages (SPEC-S4 item 21). File reads only — no DB, no server.
//   npx tsx --test tests/unslop-pages.test.ts
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const HOME = 'src/app/page.tsx';
const ARTICLE = 'src/app/article/[id]/page.tsx';
const SEARCH = 'src/app/search/page.tsx';
const LISTS = ['src/app/[country]/page.tsx', 'src/app/breaking/page.tsx', 'src/app/category/[slug]/page.tsx'];
const PUBLIC_PAGES = [HOME, ARTICLE, SEARCH, 'src/app/ranking/page.tsx', ...LISTS];
const ADMIN_PAGES = ['src/app/admin/page.tsx', 'src/app/admin/sources/page.tsx', 'src/app/admin/articles/page.tsx', 'src/app/admin/logs/page.tsx'];
const PAGES = [...PUBLIC_PAGES, ...ADMIN_PAGES];
const PIECES = [
  'src/components/PageHeading.tsx',
  'src/components/EmptyState.tsx',
  'src/components/ChipNav.tsx',
  'src/components/ArticleListing.tsx',
  'src/components/AdminParts.tsx',
];
const ALL = [...PAGES, ...PIECES];

/** 'file:line' of every line of `files` that matches `re`. */
function hits(re: RegExp, files: string[] = ALL): string[] {
  return files.flatMap((file) =>
    read(file)
      .split('\n')
      .flatMap((line, i) => (re.test(line) ? [`${file}:${i + 1}`] : [])),
  );
}

describe('S4 pages — signs that must not come back', () => {
  const banned: Array<[string, RegExp]> = [
    ['extra accents', /accent-(blue|red|green)/],
    ['white text', /text-white/],
    ['accent fills and accent hovers', /\bbg-accent\b|hover:(text|border|bg)-accent/],
    ['weights above 500 set by hand', /font-(bold|semibold|extrabold|black)/],
    ['uppercase, tracking', /\buppercase\b|\btracking-[a-z]+/],
    ['italic', /[" ]italic\b/],
    ['radii outside the tokens', /rounded-(pill|lg|md|badge)|\brounded["' `]/],
    ['shadows', /shadow-(card|elevated|dropdown|float)/],
    ['entrance animations', /animate-(fade|slide)/],
    ['catch-all transitions and hover scaling', /transition-all|hover:scale/],
    ['locale-dependent number formatting', /toLocaleString|Intl\./],
    ['half steps of the spacing scale', /[a-z]-[1-9]\d*\.5\b/],
    ['arbitrary values', /[a-z]-\[[^\]]+\]/],
    ['sizes outside the type tokens', /[" `]text-(xs|sm|xl|2xl|3xl)\b/],
    ['own focus styles (the global ring is the only one)', /focus:(outline-none|ring|border)/],
    ['category colors, relative time, reading time', /getCategoryStyle|timeAgo|estimateReadingTime/],
    // (built with the constructor: the `u` flag is not allowed in a literal at this project's TS target)
    ['pictographs', new RegExp('[\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{27BF}]', 'u')],
    ['trailing ellipsis in interface text', /(중|세요|요)\.\.\./],
    ['inline icons (the set is src/components/icons.tsx)', /<svg\b/],
  ];
  for (const [name, re] of banned) {
    test(`no ${name}`, () => {
      assert.deepEqual(hits(re), []);
    });
  }

  test('one real circle per file at most: status dots and the search spinner', () => {
    assert.deepEqual(hits(/rounded-full/), hits(/animate-spin rounded-full/, [SEARCH]));
    // the dots take their shape from STATUS_DOT in src/lib/ui.ts
    assert.match(read('src/components/AdminParts.tsx'), /STATUS_DOT/);
  });

  test('accent marks one thing in the S4 files: the source row being edited', () => {
    assert.deepEqual(hits(/\b(text|border|bg|ring|decoration)-accent\b/), hits(/selected \? 'border-accent' : 'border-transparent'/, ['src/app/admin/sources/page.tsx']));
  });

  test('meaning colors: negative on a failure figure and an error message, positive on the "on" dot', () => {
    assert.deepEqual(hits(/\b(text|bg|border)-negative\b/, PUBLIC_PAGES), []);
    assert.equal(hits(/text-negative/, ['src/components/AdminParts.tsx']).length, 1);
    assert.equal(hits(/bg-positive/, ['src/components/AdminParts.tsx']).length, 1);
    for (const file of ['src/app/admin/page.tsx', 'src/app/admin/logs/page.tsx'])
      assert.match(read(file), /\{log\.errorMessage \? <span className="text-negative">\{log\.errorMessage\}<\/span> : '-'\}/, file);
  });
});

describe('S4 pages — shared pieces', () => {
  test('every page sits in the shared container (§7-6), and none sets its own width or gutter', () => {
    for (const file of PUBLIC_PAGES) {
      const src = read(file);
      assert.match(src, /import \{[^}]*\bCONTAINER\b[^}]*\} from '@\/lib\/ui';/, file);
      assert.equal((src.match(/className=\{cn\(CONTAINER, 'py-8'\)\}/g) ?? []).length, 1, file);
    }
    assert.deepEqual(hits(/max-w-(7xl|6xl|5xl|4xl|screen-[a-z0-9]+)|mx-auto px-/), []);
    // admin pages are inside admin/layout.tsx, which holds the container
    assert.deepEqual(hits(/CONTAINER/, ADMIN_PAGES), []);
    // the article narrows the reading width inside it
    assert.match(read(ARTICLE), /<div className="mx-auto max-w-2xl">/);
  });

  test('one title row: PageHeading on every screen that has a visible h1', () => {
    for (const file of [...LISTS, 'src/app/ranking/page.tsx', SEARCH, ...ADMIN_PAGES]) {
      const src = read(file);
      assert.match(src, /<PageHeading title=/, file);
      assert.doesNotMatch(src, /<h1\b/, file);
    }
    assert.match(read('src/app/breaking/page.tsx'), /<PageHeading title="속보" count=\{total\} \/>/);
    const heading = read('src/components/PageHeading.tsx');
    assert.match(heading, /<h1 className="text-headline-lg text-text">/);
    assert.match(heading, /<span className=\{NUM\}>\{formatCount\(count\)\}<\/span>/);
    assert.match(heading, /typeof count === 'number'/);
  });

  test('one empty state, nothing drawn in it', () => {
    for (const file of [HOME, ...LISTS, 'src/app/ranking/page.tsx', SEARCH]) assert.match(read(file), /<EmptyState\b/, file);
    assert.deepEqual(hits(/py-(20|24)\b/, PAGES), []);
    assert.doesNotMatch(read('src/components/EmptyState.tsx'), /svg|img|Icon/);
  });

  test('buttons, fields, chips and tables use the classes of src/lib/ui.ts (§7-7)', () => {
    // no hand-made control: a padding pair or a height on a button / input / select / link-as-button
    assert.deepEqual(hits(/px-[0-9]+ py-[0-9]+ (bg|border|rounded)|className="[^"]*\bh-(8|10|12)\b[^"]*\brounded-control/), []);
    for (const file of ADMIN_PAGES) {
      const src = read(file);
      assert.match(src, /<div className=\{TABLE_WRAP\}/, file);
      assert.match(src, /<table className="w-full text-body-md">/, file);
      assert.match(src, /<tr className="border-b border-border">/, file);
      assert.doesNotMatch(src, /<thead className|px-4 py-3/, file);
    }
    assert.match(read('src/components/ChipNav.tsx'), /cn\(active \? CHIP_CURRENT : CHIP, 'focus-visible:-outline-offset-2'\)/);
  });

  test('the three list pages render the same listing', () => {
    for (const file of LISTS) {
      const src = read(file);
      assert.match(src, /<ArticleListing articles=\{articles\}/, file);
      assert.doesNotMatch(src, /NewsCardLarge|grid-cols/, file);
    }
    const listing = read('src/components/ArticleListing.tsx');
    assert.equal((listing.match(/grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3/g) ?? []).length, 2);
  });

  test('NewsCardCompact is imported by server components only', () => {
    for (const file of [...ALL, ...fs.readdirSync(path.join(ROOT, 'src/components')).map((f) => `src/components/${f}`)]) {
      const src = read(file);
      if (/NewsCardCompact['"]/.test(src) && /from ['"](@\/components|\.)\/NewsCardCompact['"]/.test(src))
        assert.doesNotMatch(src, /^'use client'/, `${file} is a client component`);
    }
    assert.match(read(HOME), /import NewsCardCompact from '@\/components\/NewsCardCompact';/);
  });
});

describe('S4 pages — the signature and the two moments', () => {
  const home = read(HOME);

  test('home: the lead story is the one `lead` card, with the loading priority', () => {
    assert.equal((home.match(/<NewsCardLarge article=\{hero\} priority lead \/>/g) ?? []).length, 1);
    assert.equal((home.match(/\blead\b(?= \/>)/g) ?? []).length, 1);
  });

  test('home: wire lists print the time (no rank) and run newest first by that time', () => {
    assert.doesNotMatch(home, /rank=/);
    assert.match(home, /byWireTime\(listItems\)\.map/);
    assert.match(home, /byWireTime\(secondary\)\.map/);
    assert.match(home, /<span className="dateline">KST<\/span>/);
    // the queries keep their own order (§7-11)
    assert.doesNotMatch(read('src/lib/queries.ts'), /publishedAt/);
  });

  test('home: section titles are plain and unique; the ticker wrapper clips nothing', () => {
    const titles = Array.from(home.matchAll(/<h2 className=\{SECTION_TITLE\}>([^<]+)<\/h2>/g), (m) => m[1]);
    assert.deepEqual(titles, ['주요 헤드라인', '카테고리별 뉴스', '그 밖의 뉴스']);
    assert.match(home, /const SECTION_TITLE = 'mb-4 text-headline-md text-text';/);
    assert.match(home, /<div className="mb-8">\s*<BreakingTicker/);
    // category columns are open columns: the card inside is the only box
    assert.match(home, /<div key=\{slug\} className="border-t border-border pt-4">/);
  });

  test('ranking: every rank is printed above its card, in fixed-width figures', () => {
    const src = read('src/app/ranking/page.tsx');
    assert.match(src, /<ol className="mt-8 grid /);
    assert.match(src, /\{idx \+ 1\}\s*<span className="sr-only">위<\/span>/);
    assert.doesNotMatch(src, /absolute|relative|idx < 3 &&/);
  });

  test('article: serif h1, one dateline printed at the head and the foot, full KST date', () => {
    const src = read(ARTICLE);
    assert.equal((src.match(/font-serif/g) ?? []).length, 1);
    assert.match(src, /<h1 lang=\{view\.title\.lang\} className="mb-3 font-serif text-headline-xl text-text text-balance">/);
    assert.equal((src.match(/\{dateline\}/g) ?? []).length, 2);
    assert.match(src, /<time dateTime=\{dateTime\} className="dateline">/);
    assert.match(src, /const dateLabel = formatDate\(article\.publishedAt\);/);
    assert.doesNotMatch(src, /categoryPrimary=\{/);
  });

  test('article: translation states keep their markers', () => {
    const src = read(ARTICLE);
    for (const marker of ['data-translation-status="title-pending"', 'data-translation-status="body-pending"', 'data-body-excerpt', 'data-original-body', '<details'])
      assert.ok(src.includes(marker), marker);
    assert.match(src, /const BODY_TEXT = 'space-y-6 text-base leading-7 text-text sm:text-lg sm:leading-8';/);
  });

  test('search: retry, alert and the result line', () => {
    const src = read(SEARCH);
    assert.match(src, /\[q, country, category, page, retryKey\]/);
    assert.match(src, /<EmptyState alert title="검색하지 못했습니다"/);
    assert.match(src, /setRetryKey\(\(k\) => k \+ 1\)/);
    assert.match(src, /placeholder="검색어"/);
    assert.match(src, /검색 결과 <span className=\{cn\(NUM, 'text-text'\)\}>\{formatCount\(total\)\}<\/span>건/);
    assert.match(src, /<div role="status"/);
  });

  test('admin: counts wait for the data, statuses and codes are shown in Korean', () => {
    assert.match(read('src/app/admin/articles/page.tsx'), /count=\{ready \? total : null\}/);
    assert.match(read('src/app/admin/logs/page.tsx'), /count=\{load\.status === 'ready' \? total : null\}/);
    assert.deepEqual(hits(/\{log\.status\}|\{source\.country\}|\{log\.source\.country\}|\{source\.language\}/, ADMIN_PAGES), []);
    assert.deepEqual(hits(/실패했습니다|해주세요|data\.message/, ADMIN_PAGES), []);
    // every form label points at a field
    const sources = read('src/app/admin/sources/page.tsx');
    const labels = Array.from(sources.matchAll(/<label htmlFor="([^"]+)"/g), (m) => m[1]);
    assert.equal(labels.length, 6);
    for (const id of labels) assert.ok(sources.includes(`id="${id}"`), id);
  });
});

describe('S4 pages — structure that keeps real 404s and 307s', () => {
  test('no loading boundary above a notFound() call', () => {
    for (const file of ['src/app/loading.tsx', 'src/app/[country]/loading.tsx', 'src/app/article/[id]/loading.tsx'])
      assert.equal(fs.existsSync(path.join(ROOT, file)), false, file);
  });

  test('server pages do not stream', () => {
    for (const file of PAGES) {
      const src = read(file);
      if (!/^'use client'/.test(src)) assert.doesNotMatch(src, /<Suspense/, file);
    }
  });

  test('redirects and metadata exports are still declared by the pages', () => {
    for (const file of LISTS) assert.match(read(file), /if \(resolved\.kind === 'redirect'\) redirect\(pageHref\(/, file);
    for (const file of ['src/app/[country]/page.tsx', 'src/app/category/[slug]/page.tsx', ARTICLE]) assert.match(read(file), /export async function generateMetadata/, file);
    for (const file of ['src/app/breaking/page.tsx', 'src/app/ranking/page.tsx']) assert.match(read(file), /export const metadata = \{/, file);
  });
});
