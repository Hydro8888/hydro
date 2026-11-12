/**
 * Content component invariants (slice S3: cards, ticker, tabs, pagination, share, bookmark, banners).
 * Run: npm test
 * Static: the source files are read as text, so a banned pattern fails here before it reaches a
 * browser. Contract: UNSLOP-AUDIT.md §3 and §7 (§7 wins), SPEC-S3.md.
 * The rules look at whole files, comments included. src/components/icons.tsx is shared with the
 * site chrome and is checked in tests/chrome-unslop.test.ts.
 * The last block compiles globals.css with the real Tailwind config and checks that the classes
 * these components rely on exist and cascade in the intended order.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import postcss, { type Root, type Rule } from 'postcss';
import tailwindcss from 'tailwindcss';
import config from '../tailwind.config';

const ROOT = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const c = (name: string) => `src/components/${name}.tsx`;

const HEADLINE = 'src/lib/headline.ts';
const S3 = [
  c('NewsCard'),
  c('NewsCardLarge'),
  c('NewsCardCompact'),
  c('NewsCardMeta'),
  c('ArticleImage'),
  c('ArticleHeroImage'),
  c('BreakingTicker'),
  c('CountryTabs'),
  c('Pagination'),
  c('NewsletterBanner'),
  c('TrendingKeywords'),
  c('ShareButtons'),
  c('BookmarkButton'),
  c('AdSlot'),
  c('AdminLoadError'),
  HEADLINE,
  'src/lib/image-chain.ts',
];

/** Every line of the S3 files that matches `re`, as 'file:line'. */
function hits(re: RegExp, files: string[] = S3): string[] {
  return files.flatMap((file) =>
    read(file)
      .split('\n')
      .flatMap((line, i) => (re.test(line) ? [`${file}:${i + 1}`] : [])),
  );
}
/** Occurrences of `re` (global) per file, files without a match left out. */
function occurrences(re: RegExp): Record<string, number> {
  const out: Record<string, number> = {};
  for (const file of S3) {
    const n = (read(file).match(re) ?? []).length;
    if (n > 0) out[file] = n;
  }
  return out;
}

// RegExp constructor where the pattern needs lookbehind or the u flag (the tsconfig target has no such literals).
const BANNED: { name: string; re: RegExp }[] = [
  { name: 'catch-all transitions, hover or press scaling, local durations', re: /transition-all|hover:scale|active:scale|\bscale-\d|\bduration-\d/ },
  { name: 'blur, shadows', re: /backdrop-blur|\bblur-|\bshadow-/ },
  { name: 'white or removed accent colors', re: /\b(text|bg|border)-(white|black)\b|accent-(red|blue|green)/ },
  {
    name: 'Tailwind palette hues',
    re: /\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|decoration)-(?:[lrtbxyse]-)?(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/,
  },
  { name: 'accent as a fill, a hover color or a tint', re: /bg-accent|hover:text-accent|group-hover:text-accent|accent\/\d/ },
  { name: 'uppercase / tracking / italic', re: /\buppercase\b|\btracking-|\bitalic\b/ },
  { name: 'weight 700+', re: /\bfont-(bold|extrabold|black)\b|<strong\b|<b\b/ },
  // 14px text is text-body-md; 12px is text-caption / text-meta / text-overline (same rule as the site chrome).
  { name: 'type sizes outside the tokens', re: /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl)\b/ },
  { name: 'half-step spacing', re: /[a-z]-[1-9]\d*\.5\b/ },
  { name: 'arbitrary rem values', re: /\[[\d.]+rem\]/ },
  { name: 'deprecated or default radii', re: new RegExp('rounded-(pill|badge|sm|md|lg|xl|2xl|3xl)\\b|\\brounded\\b(?!-)') },
  // The one focus indicator is the global :focus-visible outline (S1).
  { name: 'local focus rings', re: /focus:outline-none|focus:ring|\bring-|outline-none/ },
  { name: 'inline svg (icons live in icons.tsx)', re: /<svg\b|strokeWidth/ },
  { name: 'raw font-mono (figures use NUM or .dateline)', re: /\bfont-mono\b/ },
  { name: 'repeated call to action, reading time, relative time', re: /자세히 보기|분 읽기|timeAgo|estimateReadingTime/ },
  { name: 'claims that cannot be checked', re: /인기 검색어|검색 기준|AI가|매일 아침|시장 동향|해지/ },
  { name: 'category colors', re: /getCategoryStyle|CATEGORY_COLORS|catStyle/ },
  { name: 'locale-dependent numbers', re: /toLocaleString/ },
  { name: 'exclamation marks in interface text', re: new RegExp('[가-힣]!') },
  { name: 'emoji', re: new RegExp('\\p{Extended_Pictographic}', 'u') },
];

describe('S3 components — banned patterns (unslop passes 1-9)', () => {
  for (const { name, re } of BANNED) {
    test(`no ${name}`, () => {
      assert.deepEqual(hits(re), []);
    });
  }
});

describe('S3 components — the few allowed exceptions, each in one place', () => {
  test('motion: the ticker scroll and the admin spinner are the only animations', () => {
    const names = (file: string) => Array.from(new Set(read(file).match(/\banimate-[a-z-]+/g)));
    assert.deepEqual(Object.keys(occurrences(/\banimate-[a-z-]+/g)).sort(), [c('AdminLoadError'), c('BreakingTicker')]);
    assert.deepEqual(names(c('BreakingTicker')), ['animate-ticker']);
    assert.deepEqual(names(c('AdminLoadError')), ['animate-spin']);
    // the ticker moves at constant speed and stops under the pointer and under keyboard focus
    assert.match(read(c('BreakingTicker')), /animation: ticker \$\{items\.length \* 4\}s linear infinite;/);
    assert.match(read(c('BreakingTicker')), /\.animate-ticker:hover,\s*\.animate-ticker:focus-within \{\s*animation-play-state: paused;/);
  });

  test('gradients: the two ticker fades, both a change of opacity of the band color', () => {
    assert.deepEqual(occurrences(/bg-gradient-to-/g), { [c('BreakingTicker')]: 2 });
    assert.equal((read(c('BreakingTicker')).match(/bg-gradient-to-[lr] from-surface to-surface\/0/g) ?? []).length, 2);
    assert.match(read(c('BreakingTicker')), /news-ticker [^"]*\bbg-surface\b/);
  });

  test('accent = current position only: the current tab and the current page', () => {
    assert.deepEqual(hits(/\b(?:text|border|bg|ring|from|via|to|decoration)-accent\b/), [
      ...hits(/const TAB_CURRENT = /, [c('CountryTabs')]),
      ...hits(/const ACTIVE = /, [c('Pagination')]),
    ]);
    assert.match(read(c('CountryTabs')), /const TAB_CURRENT = 'border-accent text-accent';/);
    assert.match(read(c('Pagination')), /const ACTIVE = 'border-border bg-surface-elevated text-accent';/);
  });

  test('meaning colors: live on the ticker label, negative on the two error marks', () => {
    assert.deepEqual(occurrences(/\b(?:text|bg|border)-live\b/g), { [c('BreakingTicker')]: 1 });
    assert.deepEqual(occurrences(/\b(?:text|bg|border)-(?:negative|positive)\b/g), { [c('NewsletterBanner')]: 1, [c('AdminLoadError')]: 1 });
  });

  test('type: 600 and the serif belong to the lead headline', () => {
    assert.deepEqual(Object.keys(occurrences(/font-semibold/g)), [HEADLINE]);
    assert.deepEqual(occurrences(/\bfont-serif\b/g), { [c('NewsCardLarge')]: 1 });
  });

  test('one real circle: the admin spinner', () => {
    assert.deepEqual(occurrences(/rounded-full/g), { [c('AdminLoadError')]: 1 });
  });

  test('arbitrary pixel values: the four IAB ad unit sizes', () => {
    assert.deepEqual(occurrences(/\[\d+px\]/g), { [c('AdSlot')]: 4 });
    const ad = read(c('AdSlot'));
    for (const cls of ['max-w-[728px]', 'h-[90px]', 'max-w-[300px]', 'h-[250px]']) assert.ok(ad.includes(cls), cls);
    // ratios of the article hero frame are the only other bracket values
    const brackets = S3.flatMap((file) => read(file).match(/[a-z-]+-\[[^\]]+\]/g) ?? []).filter((cls) => !/\[\d+px\]/.test(cls));
    assert.deepEqual(brackets.sort(), ['aspect-[16/10]', 'aspect-[2/1]', 'aspect-[3/1]', 'aspect-[4/1]']);
  });
});

describe('S3 components — shared pieces', () => {
  test('buttons, fields and figures come from src/lib/ui.ts (§7-7, §7-15)', () => {
    const uses: Record<string, string[]> = {
      BookmarkButton: ['BTN_GHOST_SM'],
      NewsCardMeta: ['BTN_GHOST_SM'],
      ShareButtons: ['BTN_SECONDARY_SM'],
      NewsletterBanner: ['BTN_GHOST_SM', 'BTN_PRIMARY', 'FIELD'],
      AdminLoadError: ['BTN_SECONDARY', 'NUM', 'PANEL'],
      Pagination: ['NUM'],
      NewsCardCompact: ['NUM'],
      TrendingKeywords: ['NUM', 'PANEL'],
    };
    for (const [name, names] of Object.entries(uses))
      assert.match(read(c(name)), new RegExp(`import \\{ ${names.join(', ')} \\} from '@/lib/ui';`), name);
  });

  test('icons come from the shared set; every icon S3 added is used', () => {
    const icons = read('src/components/icons.tsx');
    const uses: Record<string, string[]> = {
      BookmarkButton: ['BookmarkIcon'],
      NewsCardMeta: ['ExternalIcon'],
      NewsletterBanner: ['CloseIcon'],
      Pagination: ['ChevronLeftIcon', 'ChevronRightIcon'],
    };
    for (const [name, names] of Object.entries(uses)) {
      assert.match(read(c(name)), new RegExp(`import \\{ ${names.join(', ')} \\} from './icons';`), name);
      for (const icon of names) assert.match(icons, new RegExp(`^export function ${icon}\\(`, 'm'), icon);
    }
  });

  test('wire time: every <time> carries dateTime and suppressHydrationWarning, and the dateline class', () => {
    const files = [c('NewsCardMeta'), c('NewsCardCompact')];
    let total = 0;
    for (const file of files) {
      const tags = read(file).match(/<time\b[^>]*>/g) ?? [];
      total += tags.length;
      for (const tag of tags) assert.match(tag, /^<time dateTime=\{isoDate\} suppressHydrationWarning className="dateline /, `${file}: ${tag}`);
      assert.match(read(file), /formatWireTime\(article\.publishedAt\)/);
    }
    assert.equal(total, 3);
    // no other S3 file prints a time
    assert.deepEqual(hits(/<time\b|formatWireTime|formatDate/).map((hit) => hit.split(':')[0]).filter((file) => !files.includes(file)), []);
  });

  test('cards share one meta row and one anatomy', () => {
    for (const name of ['NewsCard', 'NewsCardLarge']) {
      const src = read(c(name));
      assert.match(src, /<NewsCardMeta article=\{article\} \/>/, name);
      assert.match(src, /className="relative flex flex-col overflow-hidden rounded-card border border-border bg-surface-card transition-colors hover:bg-surface-elevated"/, name);
      assert.match(src, /<Link href=\{`\/article\/\$\{article\.id\}`\} className="block after:absolute after:inset-0">/, name);
      assert.equal((src.match(/<Link\b/g) ?? []).length, 1, `${name}: the title is the only article link`);
      assert.match(src, /<div className="flex flex-1 flex-col p-5">/, name);
    }
  });

  test('scrolling or clipped rows draw the focus ring inside (§7-19)', () => {
    for (const name of ['CountryTabs', 'BreakingTicker', 'NewsCardCompact', 'TrendingKeywords'])
      assert.match(read(c(name)), /focus-visible:-outline-offset-2/, name);
  });

  test('ArticleImage: the fallback chain is untouched; the stand-in mark is the only addition', () => {
    const src = read(c('ArticleImage'));
    for (const piece of [
      'const srcSet = isPlaceholder ? undefined : imageSrcSet(src);',
      "const priorityAttr = priority ? ({ fetchpriority: 'high' } as Record<string, string>) : {};",
      'const advance = () => setIdx((i) => nextImageIndex(i, list.length));',
      'if (img.naturalWidth === 0) advance();',
      'sizes={srcSet ? sizes : undefined}',
      "data-placeholder={isPlaceholder ? '' : undefined}",
      "data-standin={isStandIn ? '' : undefined}",
      'onError={advance}',
      "className={cn(className, 'text-transparent', isStandIn && 'img-standin')}",
    ])
      assert.ok(src.includes(piece), piece);
  });
});

// ---------------------------------------------------------------------------
// Generated CSS: a class that is not a complete literal in a scanned file, or that sits outside a
// closed scale of tailwind.config.ts, silently generates nothing.
// ---------------------------------------------------------------------------

let compiled: Promise<Root> | undefined;
function compileGlobals(): Promise<Root> {
  compiled ??= (async () => {
    const from = path.join(ROOT, 'src/app/globals.css');
    const content = (config.content as string[]).map((glob) => path.resolve(ROOT, glob));
    const result = await postcss([tailwindcss({ ...config, content })]).process(fs.readFileSync(from, 'utf8'), { from });
    return result.root;
  })();
  return compiled;
}

/** Every rule (media queries included) in source order, with the media query it sits in. */
async function rules(): Promise<{ selector: string; media: string; rule: Rule }[]> {
  const out: { selector: string; media: string; rule: Rule }[] = [];
  (await compileGlobals()).walkRules((rule) => {
    const parent = rule.parent;
    const media = parent && parent.type === 'atrule' && (parent as postcss.AtRule).name === 'media' ? (parent as postcss.AtRule).params : '';
    for (const selector of rule.selectors) out.push({ selector: selector.trim(), media, rule });
  });
  return out;
}
const decl = (rule: Rule, prop: string): string | undefined => {
  let value: string | undefined;
  rule.walkDecls(prop, (d) => {
    value = d.value;
  });
  return value;
};

describe('S3 components — generated CSS', () => {
  test('the classes these components rely on are generated', async () => {
    const selectors = new Set((await rules()).map((r) => r.selector));
    const expected = [
      '.font-serif',
      '.text-meta',
      '.dateline',
      '.img-standin',
      '.rounded-control',
      '.rounded-card',
      '.text-live',
      '.text-accent',
      '.border-accent',
      '.text-negative',
      '.border-negative',
      '.text-accent-ink',
      '.bg-surface-elevated',
      '.border-t-text-secondary',
      '.line-clamp-2',
      '.line-clamp-3',
      '.line-clamp-4',
      '.text-balance',
      '.min-w-9',
      '.min-w-10',
      '.min-w-24',
      '.min-h-32',
      '.w-12',
      '.h-56',
      '.-mb-px',
      '.to-surface\\/0',
      '.from-surface',
      '.animate-spin',
      '.sm\\:text-headline-xl',
      '.sm\\:text-headline-lg',
      '.sm\\:font-semibold',
      '.sm\\:line-clamp-3',
      '.sm\\:h-80',
      '.lg\\:h-96',
      '.hover\\:bg-surface-elevated:hover',
      '.hover\\:border-text-muted:hover',
      '.focus-visible\\:-outline-offset-2:focus-visible',
      '.after\\:absolute::after',
      '.after\\:inset-0::after',
      '.aria-pressed\\:text-text[aria-pressed="true"]',
      '.empty\\:hidden:empty',
      '.last\\:border-b-0:last-child',
    ];
    const missing = expected.filter((selector) => !selectors.has(selector));
    assert.deepEqual(missing, [], `not generated: ${missing.join(' ')}`);
  });

  test('nothing the pass removed is generated from an S3 file', async () => {
    const selectors = Array.from(new Set((await rules()).map((r) => r.selector)));
    const leftovers = selectors.filter((s) => /backdrop-blur|animate-(pulse|ping|bookmark)|scale-105|shadow-elevated|accent-(red|blue|green)|bg-accent\b(?!\\)/.test(s));
    // Other slices' pages may still hold some of these until S4; S3 files hold none (banned list above).
    for (const selector of leftovers) {
      const cls = selector.replace(/^\./, '').replace(/\\/g, '').replace(/:(hover|focus|active)$/, '');
      assert.deepEqual(hits(new RegExp(cls.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'))), [], selector);
    }
  });

  test('the lead headline is 600 at every size: the weight utility comes after the size token', async () => {
    const all = await rules();
    const index = (selector: string, media: RegExp | '') =>
      all.findIndex((r) => r.selector === selector && (media === '' ? r.media === '' : media.test(r.media)));
    const at = (selector: string, media: RegExp | '') => all[index(selector, media)].rule;

    // tokens: xl is 600, md and lg are 500
    assert.equal(decl(at('.text-headline-xl', ''), 'font-weight'), '600');
    assert.equal(decl(at('.text-headline-md', ''), 'font-weight'), '500');
    assert.equal(decl(at('.sm\\:text-headline-lg', /min-width: 640px/), 'font-weight'), '500');
    assert.equal(decl(at('.sm\\:text-headline-xl', /min-width: 640px/), 'font-weight'), '600');
    assert.equal(decl(at('.font-semibold', ''), 'font-weight'), '600');

    // same specificity, so the later rule wins
    assert.ok(index('.font-semibold', '') > index('.text-headline-md', ''), 'base: font-semibold after text-headline-md');
    assert.ok(index('.sm\\:font-semibold', /640px/) > index('.sm\\:text-headline-lg', /640px/), 'sm: font-semibold after text-headline-lg');
    assert.ok(index('.sm\\:text-headline-xl', /640px/) > index('.font-semibold', ''), 'sm: the xl token (600) comes after the base weight');
  });

  test('a pressed bookmark wins over the ghost button color', async () => {
    const all = await rules();
    const pressed = all.find((r) => r.selector === '.aria-pressed\\:text-text[aria-pressed="true"]')!;
    assert.match(decl(pressed.rule, 'color') ?? '', /^rgb\(239 233 222/);
    // attribute selector: higher specificity than .text-text-secondary, wherever it sits in the sheet
    assert.ok(all.some((r) => r.selector === '.text-text-secondary'));
  });

  test('the ticker fades end in the band color at zero opacity', async () => {
    const all = await rules();
    assert.match(decl(all.find((r) => r.selector === '.to-surface\\/0')!.rule, '--tw-gradient-to') ?? '', /^rgb\(22 21 19 \/ 0\)/);
    assert.match(decl(all.find((r) => r.selector === '.from-surface')!.rule, '--tw-gradient-from') ?? '', /^#161513/);
  });
});
