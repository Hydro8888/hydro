/**
 * Static markup of the content components (slice S3). Run: npm test
 * Each component is rendered to HTML with react-dom/server and the HTML is checked as text:
 * what a card says, what it links to, which marks it carries. Contract: SPEC-S3.md, UNSLOP-AUDIT.md §6 and §7.
 * No JSX here (tsconfig `jsx: preserve` makes tsx emit classic React.createElement calls for the
 * components, hence the global React).
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AdSlot from '../src/components/AdSlot';
import AdminLoadError, { AdminLoading } from '../src/components/AdminLoadError';
import ArticleHeroImage from '../src/components/ArticleHeroImage';
import ArticleImage from '../src/components/ArticleImage';
import BookmarkButton from '../src/components/BookmarkButton';
import BreakingTicker from '../src/components/BreakingTicker';
import CountryTabs from '../src/components/CountryTabs';
import NewsCard from '../src/components/NewsCard';
import NewsCardCompact from '../src/components/NewsCardCompact';
import NewsCardLarge from '../src/components/NewsCardLarge';
import NewsletterBanner from '../src/components/NewsletterBanner';
import Pagination from '../src/components/Pagination';
import ShareButtons from '../src/components/ShareButtons';
import TrendingKeywords from '../src/components/TrendingKeywords';
import { IMAGE_PLACEHOLDER_SRC } from '../src/lib/constants';
import { LEAD_HEADLINE_CLASS } from '../src/lib/headline';
import type { Article } from '../src/lib/types';
import { getArticleImageSources, getDefaultImage, toKstParts } from '../src/lib/utils';

(globalThis as unknown as { React: typeof React }).React = React;

const h = React.createElement;
const html = (el: React.ReactElement) => renderToStaticMarkup(el);
const count = (text: string, needle: string | RegExp) =>
  typeof needle === 'string' ? text.split(needle).length - 1 : (text.match(needle) ?? []).length;

/** The three wire-time formats (formatWireTime): today, this year, another year. */
const WIRE = /^(\d{2}:\d{2}|\d{2}\.\d{2} \d{2}:\d{2}|\d{4}\.\d{2}\.\d{2})$/;
const timeTexts = (text: string) => Array.from(text.matchAll(/<time[^>]*>(.*?)<\/time>/g), (m) => m[1].replace(/<wbr\/>/g, ''));

const NOW = new Date();
/** Noon KST on a day of the current KST year that is not today → always 'MM.DD HH:mm'. */
const OTHER_DAY = (() => {
  const p = toKstParts(NOW)!;
  const day = p.month === 1 && p.day === 1 ? 2 : 1;
  return new Date(Date.UTC(p.year, 0, day, 3, 0, 0));
})();
const OTHER_YEAR = '2001-03-04T05:06:00Z';

const article: Article = {
  id: 7,
  titleKo: '연준, 금리 인하 신호',
  titleOriginal: 'Fed signals rate cuts',
  summaryKo: '인플레이션이 예상보다 빠르게 둔화했다는 요약입니다',
  publishedAt: NOW,
  source: { sourceName: 'France 24' },
  originalUrl: 'https://example.com/a',
  country: 'us',
  categoryPrimary: 'politics',
  imageUrl: 'https://cdn.example.com/a.jpg',
};

describe('NewsCard', () => {
  const out = html(h(NewsCard, { article }));

  test('no repeated call to action, no reading time, no relative time', () => {
    assert.doesNotMatch(out, /자세히 보기|분 읽기|분 전|시간 전|방금 전/);
  });

  test('one article link — the title — and it covers the whole card', () => {
    assert.equal(count(out, 'href="/article/7"'), 1);
    assert.match(out, /<a class="block after:absolute after:inset-0" href="\/article\/7"><h3 lang="ko"/);
    assert.match(out, /^<article class="group relative /);
  });

  test('meta row: source · wire time in a <time> with the dateline class', () => {
    assert.match(out, /France 24/);
    assert.equal(count(out, '<time'), 1);
    assert.match(out, /<time dateTime="[^"]+Z" class="dateline /);
    const [wire] = timeTexts(out);
    assert.match(wire, /^\d{2}:\d{2}$/, 'published today → HH:mm');
  });

  test('the three wire formats', () => {
    for (const [publishedAt, format] of [
      [NOW, /^\d{2}:\d{2}$/],
      [OTHER_DAY, /^\d{2}\.\d{2} \d{2}:\d{2}$/],
      [OTHER_YEAR, /^2001\.03\.04$/],
    ] as const) {
      const [wire] = timeTexts(html(h(NewsCard, { article: { ...article, publishedAt } })));
      assert.match(wire, format);
      assert.match(wire, WIRE);
    }
  });

  test('category is a plain text label', () => {
    assert.match(out, /<p class="mb-2 text-caption text-text-secondary">정치<\/p>/);
    assert.doesNotMatch(html(h(NewsCard, { article: { ...article, categoryPrimary: null } })), /mb-2 text-caption/);
  });

  test('original link opens a new window and says so; bookmark is a toggle button', () => {
    assert.match(out, /<a href="https:\/\/example\.com\/a" target="_blank" rel="noopener noreferrer" aria-label="원문 보기 \(새 창\)"/);
    assert.match(out, /<button type="button" aria-label="북마크 추가" aria-pressed="false"/);
    // keyboard order = source order: title, original, bookmark
    assert.ok(out.indexOf('href="/article/7"') < out.indexOf('target="_blank"'));
    assert.ok(out.indexOf('target="_blank"') < out.indexOf('aria-pressed'));
  });

  test('two icons, both 16px with a 1.5 stroke', () => {
    const svgs = out.match(/<svg[^>]*>/g) ?? [];
    assert.equal(svgs.length, 2);
    for (const svg of svgs) {
      assert.match(svg, /stroke-width="1\.5"/);
      assert.match(svg, /class="h-4 w-4 shrink-0"/);
    }
  });

  test('no date → no <time> and no dangling separator', () => {
    const noDate = html(h(NewsCard, { article: { ...article, publishedAt: null } }));
    assert.equal(count(noDate, '<time'), 0);
    assert.equal(count(noDate, '·'), 0);
    assert.match(noDate, /France 24/);
  });

  test('nothing sits on the photo; hover is one surface step', () => {
    assert.doesNotMatch(out, /bg-gradient|backdrop-blur|shadow-|scale-|rounded-full/);
    assert.match(out, /hover:bg-surface-elevated/);
    assert.doesNotMatch(out, /hover:text-accent|text-accent/);
    // the photo box holds the image and nothing else
    assert.match(out, /<div class="relative h-40 w-full overflow-hidden bg-surface-elevated sm:h-44"><img [^>]*\/><\/div>/);
  });
});

describe('NewsCardLarge', () => {
  test('lead: marked, serif headline sized by its length, taller photo', () => {
    const out = html(h(NewsCardLarge, { article, lead: true }));
    assert.match(out, /^<article data-lead="" /);
    assert.match(out, new RegExp(`<h2 lang="ko" class="[^"]*font-serif[^"]* ${LEAD_HEADLINE_CLASS.short}"`));
    assert.match(out, /h-56 sm:h-80 lg:h-96/);
    assert.match(out, /line-clamp-4 sm:line-clamp-3/);

    const medium = html(h(NewsCardLarge, { article: { ...article, titleKo: '프랑스 학생들이 시위 압박을 이어가겠다고 다짐한 가운데 학교에서 폭력 사건 발생' }, lead: true }));
    assert.ok(medium.includes(` ${LEAD_HEADLINE_CLASS.medium}"`));
    const long = html(h(NewsCardLarge, { article: { ...article, titleKo: '가나다라 '.repeat(20) }, lead: true }));
    assert.ok(long.includes(` ${LEAD_HEADLINE_CLASS.long}"`));
  });

  test('not lead: sans 20px title on three lines, no lead mark', () => {
    const out = html(h(NewsCardLarge, { article }));
    assert.doesNotMatch(out, /data-lead|font-serif|font-semibold/);
    assert.match(out, /<h2 lang="ko" class="text-headline-md text-text line-clamp-3">/);
    assert.match(out, /h-52 sm:h-64/);
    assert.equal(count(out, 'href="/article/7"'), 1);
  });

  test('priority reaches the image', () => {
    const out = html(h(NewsCardLarge, { article, priority: true }));
    assert.match(out, /loading="eager"/);
    assert.match(out, /fetchpriority="high"/);
    assert.match(html(h(NewsCardLarge, { article })), /loading="lazy"/);
  });

  test('same anatomy as NewsCard: no overlays, no call to action, same meta row', () => {
    const out = html(h(NewsCardLarge, { article, lead: true }));
    assert.doesNotMatch(out, /자세히 보기|분 읽기|bg-gradient|backdrop-blur|shadow-|scale-/);
    assert.equal(count(out, '<svg'), 2);
    assert.match(out, /<time dateTime="[^"]+Z" class="dateline /);
    assert.match(out, /aria-label="원문 보기 \(새 창\)"/);
  });

  test('an untranslated title keeps its language tag', () => {
    const out = html(h(NewsCardLarge, { article: { ...article, titleKo: null, titleOriginal: '日本銀行、金融政策の現状維持を決定', language: 'ja' }, lead: true }));
    assert.match(out, /<h2 lang="ja"/);
  });
});

describe('NewsCardCompact', () => {
  const row = { id: 7, titleKo: '제목', titleOriginal: 'Title', publishedAt: NOW as Date | string | null, source: { sourceName: 'France 24' } };

  test('no rank → the first cell is the wire time in the 48px column', () => {
    const out = html(h(NewsCardCompact, { article: row }));
    assert.match(out, /^<a class="[^"]*" href="\/article\/7"><time dateTime="[^"]+" class="dateline w-12 shrink-0">\d{2}:\d{2}<\/time>/);
    assert.equal(count(out, '<time'), 1);
    assert.doesNotMatch(out, /<span[^>]*>\d+<\/span>/, 'no rank-like number');
    assert.equal(count(out, '<svg'), 0);
  });

  test('a time with a date wraps inside the same column: at its space, or after the year', () => {
    const otherDay = html(h(NewsCardCompact, { article: { ...row, publishedAt: OTHER_DAY } }));
    assert.match(otherDay, /class="dateline w-12 shrink-0">\d{2}\.\d{2} \d{2}:\d{2}<\/time>/);
    const otherYear = html(h(NewsCardCompact, { article: { ...row, publishedAt: OTHER_YEAR } }));
    assert.match(otherYear, /class="dateline w-12 shrink-0">2001\.<wbr\/>03\.04<\/time>/);
  });

  test('rank → the first cell is the rank, and the time moves into the meta line', () => {
    const out = html(h(NewsCardCompact, { article: row, rank: 3 }));
    assert.match(out, /^<a class="[^"]*" href="\/article\/7"><span class="w-6 shrink-0 text-meta text-text-muted font-mono tabular-nums">3<\/span>/);
    assert.match(out, /France 24<\/span><span aria-hidden="true">·<\/span><time dateTime="[^"]+" class="dateline shrink-0 whitespace-nowrap">\d{2}:\d{2}<\/time>/);
    assert.doesNotMatch(out, /w-12/);
  });

  test('no date → an empty cell of the same width keeps the title column', () => {
    const out = html(h(NewsCardCompact, { article: { ...row, publishedAt: null } }));
    assert.equal(count(out, '<time'), 0);
    assert.match(out, /href="\/article\/7"><span aria-hidden="true" class="w-12 shrink-0"><\/span>/);
    const ranked = html(h(NewsCardCompact, { article: { ...row, publishedAt: null }, rank: 1 }));
    assert.equal(count(ranked, '<time'), 0);
    assert.equal(count(ranked, '·'), 0);
  });

  test('title keeps its language tag; hover is a surface step, not the accent', () => {
    const out = html(h(NewsCardCompact, { article: { ...row, titleKo: null, titleOriginal: '中国经济', language: 'zh' } }));
    assert.match(out, /<h4 lang="zh"/);
    assert.match(out, /hover:bg-surface-elevated/);
    assert.doesNotMatch(out, /accent/);
  });
});

describe('ArticleImage', () => {
  const classOf = (out: string) => /class="([^"]*)"/.exec(out)![1];

  test('a category stock photo is marked as a stand-in and printed in greyscale', () => {
    const out = html(h(ArticleImage, { sources: [getDefaultImage('economy', 1), IMAGE_PLACEHOLDER_SRC], className: 'h-full' }));
    assert.match(out, /data-standin=""/);
    assert.equal(classOf(out), 'h-full text-transparent img-standin');
    assert.doesNotMatch(out, /data-placeholder/);
    assert.match(out, /srcSet="[^"]*images\.unsplash\.com/);
  });

  test("the story's own photo is not: it keeps its color and its srcset", () => {
    const out = html(h(ArticleImage, { sources: getArticleImageSources(article), sizes: '50vw' }));
    assert.match(out, /^<img src="\/livenews\/api\/img\/w960\.webp\?url=/);
    assert.doesNotMatch(out, /data-standin|img-standin|data-placeholder/);
    assert.match(out, /srcSet="[^"]* 320w, [^"]* 1600w" sizes="50vw"/);
    assert.match(out, /loading="lazy" decoding="async"/);
  });

  test('a stored AI-generated image is not a stand-in (§7-24)', () => {
    const src = '/livenews/api/generated-image/0123456789abcdef0123456789abcdef.jpg';
    const out = html(h(ArticleImage, { sources: getArticleImageSources({ ...article, imageUrl: src }) }));
    assert.ok(out.startsWith(`<img src="${src}"`));
    assert.doesNotMatch(out, /data-standin|img-standin/);
  });

  test('the placeholder carries data-placeholder only', () => {
    const out = html(h(ArticleImage, { sources: [] }));
    assert.match(out, /data-placeholder=""/);
    assert.doesNotMatch(out, /data-standin|img-standin|srcSet/);
    assert.equal(classOf(out), 'text-transparent');
  });
});

describe('ArticleHeroImage', () => {
  test('fixed frame, eager high-priority image, no category color, no uppercase wordmark', () => {
    const out = html(h(ArticleHeroImage, { sources: getArticleImageSources(article), categoryPrimary: 'politics', sourceName: 'NHK' }));
    assert.match(out, /^<div class="relative w-full bg-surface-elevated aspect-\[16\/10\] sm:aspect-\[2\/1\]">/);
    assert.match(out, /fetchpriority="high"/);
    assert.match(out, /loading="eager"/);
    assert.doesNotMatch(out, /border-t|uppercase|tracking-/);
  });
});

describe('Pagination', () => {
  const out = html(h(Pagination, { currentPage: 3, totalPages: 9, basePath: '/x' }));

  test('current page once per row, as accent figures on a raised surface — never an accent fill', () => {
    assert.equal(count(out, 'aria-current="page"'), 2);
    assert.equal(count(out, 'aria-label="3 페이지 (현재)"'), 2);
    assert.match(out, /aria-current="page"[^>]*class="[^"]*border-border bg-surface-elevated text-accent"/);
    assert.doesNotMatch(out, /bg-accent|text-white/);
    assert.equal(count(out, 'text-accent'), 2);
  });

  test('figures are fixed-width; arrows come from the icon set', () => {
    assert.match(out, /font-mono tabular-nums/);
    assert.equal(count(out, '<svg'), 4);
    assert.equal(count(out, 'stroke-width="1.5"'), 4);
    assert.match(out, /aria-label="이전 페이지"[^>]*href="\/x\?page=2"/);
    assert.match(out, /aria-label="다음 페이지"[^>]*href="\/x\?page=4"/);
  });

  test('every link stays inside 1..total', () => {
    for (const [current, total] of [[3, 9], [1, 5497], [5497, 5497], [9999, 12], [0, 3], [NaN, 4]] as const) {
      const pages = Array.from(html(h(Pagination, { currentPage: current, totalPages: total, basePath: '/x' })).matchAll(/page=(\d+)/g), (m) => Number(m[1]));
      assert.ok(pages.length > 0, `${current}/${total}`);
      assert.ok(pages.every((p) => p >= 1 && p <= total), `${current}/${total}: ${pages.join(',')}`);
    }
  });

  test('the first page has no previous link; a single page renders nothing', () => {
    const first = html(h(Pagination, { currentPage: 1, totalPages: 3, basePath: '/x?q=a&page=[page]' }));
    assert.equal(count(first, 'aria-label="이전 페이지"'), 0);
    assert.equal(count(first, 'aria-disabled="true"'), 2);
    assert.match(first, /href="\/x\?q=a&amp;page=2"/);
    assert.equal(html(h(Pagination, { currentPage: 1, totalPages: 1, basePath: '/x' })), '');
    assert.equal(html(h(Pagination, { currentPage: 1, totalPages: 0, basePath: '/x' })), '');
  });
});

describe('CountryTabs', () => {
  const out = html(h(CountryTabs, { activeCountry: 'us', basePath: '/ranking?country=[country]' }));

  test('five Korean labels, no English sub-labels', () => {
    for (const label of ['전체', '세계', '미국', '일본', '중국']) assert.match(out, new RegExp(`>${label}</a>`));
    assert.doesNotMatch(out, /\(|World|Japan/);
  });

  test('only the current tab is accent', () => {
    assert.equal(count(out, 'aria-current="page"'), 1);
    assert.match(out, /<a aria-current="page" class="[^"]*border-accent text-accent" href="\/ranking\?country=us">미국<\/a>/);
    assert.equal(count(out, 'text-accent'), 1);
  });

  test('the row scrolls, so the focus ring is drawn inside the tab (§7-19)', () => {
    assert.match(out, /^<nav aria-label="국가별 뉴스" class="w-full overflow-x-auto scrollbar-none">/);
    assert.equal(count(out, 'focus-visible:-outline-offset-2'), 5);
    assert.equal(count(out, /class="inline-flex h-10 /g), 5);
  });

  test('default links', () => {
    const home = html(h(CountryTabs, { activeCountry: 'all' }));
    assert.match(home, /href="\/">전체/);
    assert.match(home, /href="\/\?country=japan">일본/);
  });
});

describe('TrendingKeywords', () => {
  test('says what the data is: article count per category, by Korean name, linking to the category', () => {
    const out = html(h(TrendingKeywords, { keywords: [{ keyword: 'politics', count: 45042 }, { keyword: 'ai-tech', count: 1200 }] }));
    assert.match(out, /<h2 [^>]*>카테고리별 기사 수<\/h2>/);
    assert.doesNotMatch(out, /인기 검색어|검색 기준|실시간/);
    assert.match(out, /<a [^>]*href="\/category\/politics">/);
    assert.match(out, />정치<\/span>/);
    assert.match(out, />45,042<\/span>/);
    assert.match(out, /href="\/category\/ai-tech"/);
    assert.match(out, />AI·테크<\/span>/);
    assert.doesNotMatch(out, />politics</);
  });

  test('a keyword that is not a category keeps its text and the search link', () => {
    const out = html(h(TrendingKeywords, { keywords: [{ keyword: '반도체 수출', count: 0 }] }));
    assert.match(out, /href="\/search\?q=%EB%B0%98%EB%8F%84%EC%B2%B4%20%EC%88%98%EC%B6%9C"/);
    assert.match(out, />반도체 수출<\/span>/);
    assert.doesNotMatch(out, />0<\/span>/, 'a zero count is not printed');
  });

  test('ranks and counts are quiet fixed-width figures; rows are 40px', () => {
    const out = html(h(TrendingKeywords, { keywords: [{ keyword: 'economy', count: 7 }] }));
    assert.match(out, /<span class="w-6 text-meta text-text-muted font-mono tabular-nums" aria-label="1위">1<\/span>/);
    assert.match(out, /class="flex h-10 items-center /);
    assert.doesNotMatch(out, /accent|rounded-pill|font-bold|amber/);
  });

  test('at most ten rows; an empty list says so', () => {
    const many = Array.from({ length: 14 }, (_, i) => ({ keyword: `k${i}`, count: i }));
    assert.equal(count(html(h(TrendingKeywords, { keywords: many })), '<li>'), 10);
    const empty = html(h(TrendingKeywords, { keywords: [] }));
    assert.match(empty, /카테고리별 기사 수/);
    assert.match(empty, /아직 집계된 기사가 없습니다</);
  });
});

describe('BookmarkButton · ShareButtons', () => {
  test('bookmark: one icon, toggle semantics, pressed state by fill and text color (no accent, no blur)', () => {
    const out = html(h(BookmarkButton, { articleId: 7 }));
    assert.equal(count(out, '<svg'), 1);
    assert.match(out, /aria-pressed="false"/);
    assert.match(out, /aria-pressed:text-text/);
    assert.doesNotMatch(out, /backdrop-blur|rounded-full|animate-|accent/);
  });

  test('share: three named links and a copy button, no brand marks, one live region', () => {
    const out = html(h(ShareButtons, { url: 'https://example.com/a?b=1', title: '제목' }));
    assert.equal(count(out, '<svg'), 0);
    assert.equal(count(out, 'target="_blank" rel="noopener noreferrer"'), 3);
    for (const label of ['카카오톡', '페이스북', 'X']) assert.match(out, new RegExp(`aria-label="${label}에 공유 \\(새 창\\)"[^>]*>${label}</a>`));
    assert.match(out, /<button type="button" class="[^"]*">링크 복사<\/button>/);
    assert.match(out, /<span role="status" aria-live="polite" class="sr-only"><\/span>/);
    assert.match(out, /url=https%3A%2F%2Fexample\.com%2Fa%3Fb%3D1&amp;text=%EC%A0%9C%EB%AA%A9/);
    assert.doesNotMatch(out, /accent|negative/);
  });
});

describe('BreakingTicker', () => {
  // styled-jsx attributes (`jsx`, `global`) are compiled away by Next; under react-dom/server they
  // only produce two dev warnings, silenced here.
  const render = (el: React.ReactElement) => {
    const original = console.error;
    console.error = () => {};
    try {
      return html(el);
    } finally {
      console.error = original;
    }
  };
  const articles = [
    { id: '1', titleKo: '첫 소식', titleOriginal: 'First' },
    { id: '2', titleKo: null, titleOriginal: '日本の速報', language: 'ja' },
  ];
  const out = render(h(BreakingTicker, { articles }));

  test('a marquee with a text label in the live color — no badge, no pulsing dot', () => {
    assert.match(out, /^<div class="news-ticker [^"]*" role="marquee" aria-label="속보">/);
    assert.match(out, /<span class="whitespace-nowrap text-overline text-live">속보<\/span>/);
    assert.doesNotMatch(out, /animate-pulse|bg-live|bg-accent|rounded-full|text-white/);
    assert.equal(count(out, 'text-live'), 1);
  });

  test('items are doubled for the loop; the copies are hidden and out of the tab order', () => {
    assert.equal(count(out, '<li'), 4);
    assert.equal(count(out, 'aria-hidden="true"><a tabindex="-1"'), 2);
    assert.equal(count(out, 'aria-hidden="false"><a tabindex="0"'), 2);
    assert.match(out, /<a tabindex="0" lang="ja"[^>]*href="\/article\/2">日本の速報<\/a>/);
  });

  test('scroll: linear, endless, paused on hover and focus; both fades are the band color', () => {
    assert.match(out, /animation: ticker 8s linear infinite/);
    assert.match(out, /\.animate-ticker:hover,\s*\.animate-ticker:focus-within \{\s*animation-play-state: paused;/);
    assert.equal(count(out, 'from-surface to-surface/0'), 2);
    assert.equal(count(out, 'bg-gradient-to-'), 2);
  });

  test('no articles → nothing', () => {
    assert.equal(render(h(BreakingTicker, { articles: [] })), '');
  });
});

describe('admin states · flags', () => {
  test('load error: an alert with the error color on its rule only, HTTP status in fixed-width figures, a retry button', () => {
    const out = html(h(AdminLoadError, { kind: 'server', status: 503, onRetry: () => {} }));
    assert.match(out, /<div role="alert" class="[^"]*border-l-2 border-negative[^"]*">/);
    assert.match(out, /잠시 후 다시 시도하세요<span class="[^"]*font-mono tabular-nums">\(HTTP 503\)<\/span>/);
    assert.match(out, /<button type="button" class="[^"]*">다시 시도<\/button>/);
    assert.doesNotMatch(out, /text-negative|accent(?!-ink)|rounded-lg/);
    assert.doesNotMatch(html(h(AdminLoadError, { kind: 'network', onRetry: () => {} })), /HTTP/);
  });

  test('loading: a neutral spinner announced as status', () => {
    const out = html(h(AdminLoading));
    assert.match(out, /^<div role="status"/);
    assert.match(out, /animate-spin rounded-full border-2 border-border border-t-text-secondary/);
    assert.match(out, /<span class="sr-only">불러오는 중<\/span>/);
  });

  test('newsletter banner and ad slots render nothing while their flags are off', () => {
    assert.equal(html(h(NewsletterBanner)), '');
    for (const size of ['banner', 'sidebar', 'native'] as const) assert.equal(html(h(AdSlot, { size })), '');
  });
});
