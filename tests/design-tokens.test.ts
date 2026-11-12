/**
 * Design-system invariants (slice S1). Run: npm test
 * Token contract: UNSLOP-AUDIT.md §3, amended by §7 (one neutral ramp, one accent, weights 400-600,
 * one easing, one shadow, one focus ring).
 * S1-A lesson: a class name that is not a complete literal inside a file Tailwind scans is
 * silently missing from the CSS bundle. The last block compiles globals.css with the real
 * config (no network, ~0.5s) and checks the generated CSS itself.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import postcss, { type Root } from 'postcss';
import tailwindcss from 'tailwindcss';
import config from '../tailwind.config';
import * as constants from '../src/lib/constants';
import * as utils from '../src/lib/utils';
import * as ui from '../src/lib/ui';

const ROOT = path.resolve(__dirname, '..');

type Tokens = Record<string, string>;
const extend = (config.theme?.extend ?? {}) as unknown as {
  colors: Record<string, Tokens>;
  borderColor: Tokens;
  fontSize: Record<string, [string, Tokens]>;
};

const { BREAKING_ITEMS_PER_PAGE, CATEGORIES, IMAGE_PLACEHOLDER_SRC, ITEMS_PER_PAGE, MAX_PAGE } = constants;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const theme = (config.theme ?? {}) as unknown as Record<string, Record<string, unknown>>;
const readSrc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** WCAG 2.x contrast ratio of two '#rrggbb' colors. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
/** Tailwind palette hues + white/black used as utility classes (bg-red-500, text-white, border-l-gray-500/10 …). */
const EMOJI_RE = new RegExp('\\p{Extended_Pictographic}', 'u'); // constructor: the tsconfig target has no /u literal
const HUE_CLASS_RE =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|decoration|shadow)-(?:[lrtbxyse]-)?(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|white|black)(?:-\d{2,3})?\b/;

// ---------------------------------------------------------------------------

describe('categories — plain labels, no style per category (unslop pass 2/3)', () => {
  const slugs = CATEGORIES.map((c) => c.slug);

  test('16 categories; no style map or style helper is exported any more', () => {
    assert.equal(slugs.length, 16);
    assert.equal(new Set(slugs).size, 16);
    for (const name of ['CATEGORY_COLORS', 'NEUTRAL_CATEGORY_STYLE']) assert.ok(!(name in constants), name);
    for (const name of ['getCategoryStyle', 'timeAgo', 'estimateReadingTime']) assert.ok(!(name in utils), name);
  });

  test('CATEGORIES carry slug + label only: no icon field, no emoji', () => {
    for (const c of CATEGORIES) {
      assert.deepEqual(Object.keys(c).sort(), ['label', 'slug'], c.slug);
      assert.doesNotMatch(c.label, EMOJI_RE, c.slug);
    }
    assert.doesNotMatch(readSrc('src/lib/constants.ts'), EMOJI_RE);
  });

  test('constants.ts and utils.ts hold no hue classes, deleted tokens or animation classes', () => {
    for (const rel of ['src/lib/constants.ts', 'src/lib/utils.ts']) {
      const src = readSrc(rel);
      assert.doesNotMatch(src, HUE_CLASS_RE, rel);
      assert.doesNotMatch(src, /accent-(?:blue|red|green)|animate-/, rel);
    }
  });
});

describe('tailwind.config.ts', () => {
  test('content scans src/lib and src/hooks', () => {
    const content = config.content as string[];
    assert.ok(Array.isArray(content));
    assert.ok(content.some((glob) => glob.includes('src/lib/')), 'src/lib missing from content');
    assert.ok(content.some((glob) => glob.includes('src/hooks/')), 'src/hooks missing from content');
  });

  test('palette = UNSLOP-AUDIT §3 + §7: one warm neutral ramp, one accent, meaning-only colors', () => {
    const colors = extend.colors as unknown as Record<string, unknown>;
    assert.deepEqual(colors.surface, { deep: '#12110f', DEFAULT: '#161513', card: '#1c1a18', elevated: '#262421' });
    assert.deepEqual(colors.text, { DEFAULT: '#efe9de', secondary: '#aaa398', muted: '#918b81' });
    assert.deepEqual(colors.accent, { DEFAULT: '#f0883e', ink: '#161513' });
    assert.deepEqual(colors.border, { DEFAULT: 'rgba(239,233,222,0.10)', muted: 'rgba(239,233,222,0.06)' });
    assert.equal(colors.live, '#ea5d61');
    assert.equal(colors.positive, '#4cc38a');
    assert.equal(colors.negative, '#ea5d61');
    assert.deepEqual(Object.keys(colors).sort(), ['accent', 'border', 'live', 'negative', 'positive', 'surface', 'text']);
  });

  test('default border color = hairline token (not Tailwind gray-200)', () => {
    assert.equal(extend.borderColor.DEFAULT, extend.colors.border.DEFAULT);
    assert.equal(extend.borderColor.DEFAULT, 'rgba(239,233,222,0.10)');
  });

  test('default ring color = accent (not Tailwind blue-500)', () => {
    const ringColor = (extend as unknown as { ringColor: Tokens }).ringColor;
    assert.equal(ringColor.DEFAULT, extend.colors.accent.DEFAULT);
    assert.equal(ringColor.DEFAULT, '#f0883e');
  });

  test('type scale: sizes / line-heights / weights from the contract, nothing at 700+', () => {
    const fontSize = extend.fontSize as unknown as Record<string, [string, Tokens]>;
    assert.deepEqual(fontSize, {
      'headline-xl': ['clamp(1.75rem, 1.2rem + 2vw, 2.5rem)', { lineHeight: '1.2', fontWeight: '600' }],
      'headline-lg': ['1.75rem', { lineHeight: '1.25', fontWeight: '500' }],
      'headline-md': ['1.25rem', { lineHeight: '1.35', fontWeight: '500' }],
      'headline-sm': ['1rem', { lineHeight: '1.45', fontWeight: '500' }],
      'body-lg': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
      'body-md': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
      caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
      overline: ['0.75rem', { lineHeight: '1rem', fontWeight: '500', letterSpacing: '0' }],
      meta: ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
    });
    assert.deepEqual(theme.fontWeight, { normal: '400', medium: '500', semibold: '600' });
    // §7-5: 600 belongs to the large headline only
    const at600 = Object.keys(fontSize).filter((k) => fontSize[k][1].fontWeight === '600');
    assert.deepEqual(at600, ['headline-xl']);
  });

  test('font families: Pretendard interface, serif for the two big headlines, mono for figures', () => {
    const ff = (extend as unknown as { fontFamily: Record<string, string[]> }).fontFamily;
    assert.deepEqual(ff.sans.slice(0, 2), ['Pretendard Variable', 'Pretendard']);
    assert.equal(ff.sans[ff.sans.length - 1], 'sans-serif');
    assert.deepEqual(ff.serif, ['Noto Serif KR', 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', 'serif']);
    // Plex Mono has no Hangul: Pretendard follows it so a unit like '건' never drops to a system font
    assert.deepEqual(ff.mono, ['IBM Plex Mono', 'Pretendard Variable', 'Pretendard', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']);
  });

  test('radius: tag 6 / control 8 / card 12 / panel 16', () => {
    const r = (extend as unknown as { borderRadius: Tokens }).borderRadius;
    assert.deepEqual({ tag: r.tag, control: r.control, card: r.card, panel: r.panel }, { tag: '0.375rem', control: '0.5rem', card: '0.75rem', panel: '1rem' });
    // deprecated aliases kept until S2–S4 stop using them
    assert.equal(r.badge, r.tag);
    assert.equal(r.pill, r.control);
    assert.deepEqual(Object.keys(r).sort(), ['badge', 'card', 'control', 'panel', 'pill', 'tag']);
  });

  test('motion: one easing, three durations, named properties, one entrance', () => {
    assert.deepEqual(theme.transitionTimingFunction, { DEFAULT: EASE, linear: 'linear' });
    assert.deepEqual(theme.transitionDuration, { DEFAULT: '150ms', 0: '0ms', 150: '150ms', 200: '200ms', 400: '400ms' });
    assert.deepEqual(Object.keys(theme.transitionProperty).sort(), ['DEFAULT', 'colors', 'none', 'opacity', 'transform']);
    for (const v of Object.values(theme.transitionProperty)) assert.doesNotMatch(String(v), /\ball\b|shadow|filter|width|height|margin|top|left/);
    assert.deepEqual(theme.animation, { none: 'none', spin: 'spin 1s linear infinite', 'fade-in': `fade-in 400ms ${EASE} backwards` });
    assert.deepEqual(theme.keyframes, {
      spin: { to: { transform: 'rotate(360deg)' } },
      'fade-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
    });
  });

  test('depth: the only shadow is shadow-float', () => {
    assert.deepEqual(theme.boxShadow, { none: 'none', float: '0 8px 24px rgba(0,0,0,0.35)' });
  });

  test('contrast (WCAG 2.x): every text role reaches 4.5:1 on every surface step', () => {
    const colors = extend.colors as unknown as {
      surface: Tokens; text: Tokens; accent: Tokens; live: string; positive: string; negative: string;
    };
    const surfaces = Object.values(colors.surface);
    assert.equal(surfaces.length, 4);
    const asText: Record<string, string> = {
      text: colors.text.DEFAULT,
      'text-secondary': colors.text.secondary,
      'text-muted': colors.text.muted,
      accent: colors.accent.DEFAULT,
      live: colors.live,
      positive: colors.positive,
      negative: colors.negative,
    };
    for (const [name, fg] of Object.entries(asText)) {
      for (const bg of surfaces) assert.ok(contrast(fg, bg) >= 4.5, `${name} ${fg} on ${bg} = ${contrast(fg, bg).toFixed(2)}`);
    }
    // labels on fills: accent-ink on the primary button (text-colored), on accent and on live / positive
    for (const fill of [colors.text.DEFAULT, colors.accent.DEFAULT, colors.live, colors.positive]) {
      assert.ok(contrast(colors.accent.ink, fill) >= 4.5, `accent-ink on ${fill} = ${contrast(colors.accent.ink, fill).toFixed(2)}`);
    }
    // the focus ring is a non-text indicator: 3:1 against every surface
    for (const bg of surfaces) assert.ok(contrast(colors.accent.DEFAULT, bg) >= 3, bg);
  });
});

describe('src/lib/ui.ts — shared control and table classes', () => {
  const strings: Record<string, string> = {};
  for (const [name, value] of Object.entries(ui)) if (typeof value === 'string') strings[name] = value;
  const has = (value: string, cls: string) => value.split(' ').includes(cls);

  test('exports the names both plans use (SPEC-S4 item 0, SPEC-S2 item 4)', () => {
    assert.deepEqual(Object.keys(ui).sort(), [
      'BTN_GHOST_SM', 'BTN_PRIMARY', 'BTN_SECONDARY', 'BTN_SECONDARY_SM', 'CHIP', 'CHIP_CURRENT', 'CONTAINER', 'FIELD', 'FIELD_SM',
      'LOG_STATUS', 'NUM', 'PANEL', 'STATUS_DOT', 'TABLE_WRAP', 'TAG', 'TD', 'TD_MAIN', 'TD_NUM', 'TD_TIME', 'TH', 'TH_NUM',
      'TR', 'TR_SELECTED',
    ]);
  });

  test('controls: 40px (32px compact), rounded-control, weight 500', () => {
    for (const name of ['BTN_PRIMARY', 'BTN_SECONDARY', 'FIELD']) assert.ok(has(strings[name], 'h-10'), name);
    for (const name of ['BTN_SECONDARY_SM', 'BTN_GHOST_SM', 'FIELD_SM', 'CHIP', 'CHIP_CURRENT']) assert.ok(has(strings[name], 'h-8'), name);
    for (const name of ['BTN_PRIMARY', 'BTN_SECONDARY', 'BTN_SECONDARY_SM', 'BTN_GHOST_SM', 'FIELD', 'FIELD_SM', 'CHIP', 'CHIP_CURRENT']) {
      assert.ok(has(strings[name], 'rounded-control'), name);
    }
    for (const name of ['BTN_PRIMARY', 'BTN_SECONDARY', 'BTN_SECONDARY_SM', 'BTN_GHOST_SM']) assert.ok(has(strings[name], 'font-medium'), name);
    assert.ok(has(ui.TAG, 'rounded-tag') && has(ui.TAG, 'h-6'));
    // Field text: 16px below lg (iOS Safari zooms the page on focus under 16px), 14px from lg.
    for (const name of ['FIELD', 'FIELD_SM']) {
      assert.deepEqual(strings[name].split(' ').filter((c) => /^(\w+:)?text-(base|body-\w+|headline-\w+|caption|meta|xs|sm|lg)$/.test(c)), ['text-base', 'lg:text-body-md'], name);
    }
    // Table cells: fixed height, no vertical padding of their own or the browser's.
    for (const name of ['TH', 'TH_NUM', 'TD', 'TD_MAIN', 'TD_NUM', 'TD_TIME']) assert.ok(has(strings[name], 'py-0') && has(strings[name], 'px-4'), name);
  });

  test('primary = text-colored surface + accent-ink label; the accent is never a fill', () => {
    assert.ok(has(ui.BTN_PRIMARY, 'bg-text') && has(ui.BTN_PRIMARY, 'text-accent-ink'));
    assert.ok(has(ui.BTN_SECONDARY, 'bg-surface-elevated') && has(ui.BTN_SECONDARY, 'border-border'));
    assert.ok(has(ui.CHIP_CURRENT, 'text-accent') && has(ui.CHIP_CURRENT, 'bg-surface-elevated'));
    assert.doesNotMatch(readSrc('src/lib/ui.ts'), /bg-accent(?!-ink)|bg-live/);
  });

  test('meaning colors sit on the status dot only; partial stays neutral', () => {
    assert.deepEqual(ui.LOG_STATUS, {
      success: { label: '성공', dot: 'bg-positive' },
      failed: { label: '실패', dot: 'bg-negative' },
      partial: { label: '부분', dot: 'bg-text-muted' },
    });
    assert.doesNotMatch(Object.values(strings).join(' '), /positive|negative|live/);
  });

  test('source holds no hue classes, pills, shadows, 700+ weights, uppercase, tracking or off-grid steps', () => {
    const src = readSrc('src/lib/ui.ts');
    assert.doesNotMatch(src, HUE_CLASS_RE);
    assert.doesNotMatch(src, /rounded-(?:pill|badge|lg|md|xl)\b|shadow-|font-(?:bold|extrabold|black)|uppercase|tracking-|italic|animate-|transition-all|backdrop-|gradient/);
    assert.doesNotMatch(src, /-\d+\.5\b|-\[/);
    assert.doesNotMatch(src, EMOJI_RE);
  });
});

describe('IMAGE_PLACEHOLDER_SRC', () => {
  const decodeSvg = () => decodeURIComponent(IMAGE_PLACEHOLDER_SRC.slice(IMAGE_PLACEHOLDER_SRC.indexOf(',') + 1));

  test('inline SVG data URI with an 800x500 (16:10) viewBox', () => {
    assert.equal(typeof IMAGE_PLACEHOLDER_SRC, 'string');
    assert.ok(IMAGE_PLACEHOLDER_SRC.startsWith('data:image/svg+xml'));
    const svg = decodeSvg();
    assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
    assert.ok(svg.includes('viewBox="0 0 800 500"'));
  });

  test('no external references, text or fonts', () => {
    const svg = decodeSvg();
    for (const banned of ['href', 'url(', '<image', '<text', '@import', 'font']) {
      assert.ok(!svg.includes(banned), `contains ${banned}`);
    }
  });

  test('uses only dark-palette colors', () => {
    const palette = new Set(
      ['surface', 'text', 'accent', 'border'].flatMap((group) => Object.values(extend.colors[group]).map((v) => v.toLowerCase())),
    );
    const hexes = decodeSvg().match(/#[0-9a-fA-F]{6}\b/g) ?? [];
    assert.ok(hexes.length > 0);
    for (const hex of hexes) assert.ok(palette.has(hex.toLowerCase()), `${hex} is not a palette color`);
  });
});

describe('globals.css source (unslop passes 2, 5, 9)', () => {
  const css = readSrc('src/app/globals.css');

  test('no @import, gradient, glow, keyframes, catch-all transition or hard-coded hex', () => {
    for (const banned of [/@import/, /gradient/, /box-shadow/, /@keyframes/, /animation\s*:/, /transition-all/, /#[0-9a-fA-F]{3,8}\b/, /uppercase|tracking-|italic/, /-\d+\.5\b|-\[\d/]) {
      assert.doesNotMatch(css, banned);
    }
  });

  test('dead and decorative classes are gone', () => {
    for (const cls of ['.news-card', '.category-pill', '.country-badge', '.tab-item', '.breaking-ticker', '.text-gradient-amber', '.border-glow', '.surface-interactive', '.shimmer']) {
      assert.ok(!css.includes(cls), `${cls} still defined`);
    }
  });
});

describe('paging constants', () => {
  test('MAX_PAGE / BREAKING_ITEMS_PER_PAGE / ITEMS_PER_PAGE', () => {
    assert.ok(Number.isInteger(MAX_PAGE) && MAX_PAGE > 0);
    assert.equal(BREAKING_ITEMS_PER_PAGE, 30);
    assert.equal(ITEMS_PER_PAGE, 20);
    // largest possible Prisma skip stays inside a 32-bit Int
    assert.ok(MAX_PAGE * Math.max(BREAKING_ITEMS_PER_PAGE, ITEMS_PER_PAGE) <= 2 ** 31 - 1);
  });
});

// ---------------------------------------------------------------------------
// Generated CSS
// ---------------------------------------------------------------------------

/** Class names the other slices will use; unused @layer classes are tree-shaken, so they are fed to Tailwind as raw content. */
const CONTRACT_CLASSES =
  'dateline img-standin font-serif font-mono text-meta text-overline rounded-tag rounded-control rounded-card rounded-panel ' +
  'shadow-float animate-fade-in bg-surface-deep text-accent-ink bg-live text-live text-positive text-negative transition-colors duration-200 duration-400 font-semibold';
/** Class names that must NOT generate CSS any more. */
const REMOVED_CLASSES =
  'text-accent-red bg-accent-blue text-accent-green bg-primary bg-dark bg-light font-bold font-extrabold font-black transition-all duration-300 duration-500 ' +
  'ease-in ease-out ease-in-out shadow-card shadow-elevated shadow-dropdown shadow-lg animate-pulse animate-ping animate-bounce animate-pulse-dot ' +
  'animate-bookmark-pop animate-slide-up animate-toast-in shimmer text-gradient-amber border-glow';

let compiled: Promise<Root> | undefined;
/** globals.css → Tailwind (project config, content globs resolved from the repo root). */
function compileGlobals(): Promise<Root> {
  compiled ??= (async () => {
    const from = path.join(ROOT, 'src/app/globals.css');
    const content = [
      ...(config.content as string[]).map((glob) => path.resolve(ROOT, glob)),
      { raw: `<i class="${CONTRACT_CLASSES} ${REMOVED_CLASSES}"></i>`, extension: 'html' },
    ];
    const result = await postcss([tailwindcss({ ...config, content })]).process(fs.readFileSync(from, 'utf8'), { from });
    return result.root;
  })();
  return compiled;
}

/** Declarations of every top-level rule whose selector list contains `selector`. */
function declsFor(root: Root, selector: string): Tokens {
  const out: Tokens = {};
  root.each((node) => {
    if (node.type !== 'rule' || !node.selectors.map((s) => s.trim()).includes(selector)) return;
    node.walkDecls((d) => {
      out[d.prop] = d.value;
    });
  });
  return out;
}

const classSelector = (cls: string) => '.' + cls.replace(/\//g, '\\/');

async function topLevelSelectors(): Promise<Set<string>> {
  const selectors = new Set<string>();
  (await compileGlobals()).each((node) => {
    if (node.type === 'rule') node.selectors.forEach((s) => selectors.add(s.trim().replace(/:(hover|focus|focus-visible|active)$/, '')));
  });
  return selectors;
}

describe('generated CSS (globals.css + tailwind.config.ts)', () => {
  test('every contract class exists', async () => {
    const selectors = await topLevelSelectors();
    const classes = CONTRACT_CLASSES.split(' ');
    const missing = classes.filter((cls) => !selectors.has(classSelector(cls)));
    assert.deepEqual(missing, [], `not generated: ${missing.join(' ')}`);
  });

  test('deleted tokens, 700+ weights, catch-all transitions, shadows and looping animations generate nothing', async () => {
    const selectors = await topLevelSelectors();
    const leaked = REMOVED_CLASSES.split(' ').filter((cls) => selectors.has(classSelector(cls)));
    assert.deepEqual(leaked, [], `still generated: ${leaked.join(' ')}`);
    const keyframes: string[] = [];
    (await compileGlobals()).walkAtRules('keyframes', (r) => { keyframes.push(r.params); });
    assert.deepEqual(Array.from(new Set(keyframes)).sort(), ['fade-in', 'spin']);
  });

  test('preflight paints uncolored borders with the hairline token', async () => {
    assert.equal(declsFor(await compileGlobals(), '*')['border-color'], 'rgba(239,233,222,0.10)');
  });

  test('global wrapping: body anywhere + keep-all; ja/zh normal; tables reset', async () => {
    const root = await compileGlobals();
    const body = declsFor(root, 'body');
    assert.equal(body['overflow-wrap'], 'anywhere');
    assert.equal(body['word-break'], 'keep-all');
    assert.equal(declsFor(root, ':lang(ja)')['word-break'], 'normal');
    assert.equal(declsFor(root, ':lang(zh)')['word-break'], 'normal');
    const table = declsFor(root, 'table');
    assert.equal(table['overflow-wrap'], 'break-word');
    assert.equal(table['word-break'], 'normal');
  });

  test('.scrollbar-hide behaves like .scrollbar-none', async () => {
    const root = await compileGlobals();
    for (const cls of ['.scrollbar-none', '.scrollbar-hide']) {
      assert.equal(declsFor(root, cls)['scrollbar-width'], 'none', cls);
      assert.equal(declsFor(root, `${cls}::-webkit-scrollbar`).display, 'none', cls);
    }
  });

  test('.text-headline-xl compiles to the fluid clamp(), weight 600', async () => {
    const d = declsFor(await compileGlobals(), '.text-headline-xl');
    assert.equal(d['font-size'], 'clamp(1.75rem, 1.2rem + 2vw, 2.5rem)');
    assert.equal(d['font-weight'], '600');
    assert.equal(d['line-height'], '1.2');
  });

  test('.text-headline-lg: 28px, weight 500 (600 is headline-xl only)', async () => {
    const d = declsFor(await compileGlobals(), '.text-headline-lg');
    assert.equal(d['font-size'], '1.75rem');
    assert.equal(d['font-weight'], '500');
  });

  test('every class in src/lib/ui.ts generates CSS', async () => {
    const selectors: string[] = [];
    (await compileGlobals()).walkRules((rule) => { selectors.push(...rule.selectors.map((sel) => sel.trim())); });
    const values = Object.values(ui).flatMap((v) => (typeof v === 'string' ? [v] : Object.values(v).map((s) => s.dot)));
    const classes = Array.from(new Set(values.join(' ').split(/\s+/).filter(Boolean)));
    assert.ok(classes.length > 40, String(classes.length));
    // variants compile to '.hover\:bg-text\/90:hover', '.placeholder\:text-text-muted::placeholder', …
    const missing = classes.filter((cls) => {
      const escaped = '.' + cls.replace(/[:/]/g, '\\$&');
      return !selectors.some((sel) => sel === escaped || sel.startsWith(escaped + ':'));
    });
    assert.deepEqual(missing, [], `not generated: ${missing.join(' ')}`);
  });

  test('.text-overline: 12px/16px, weight 500, letter-spacing 0', async () => {
    assert.deepEqual(declsFor(await compileGlobals(), '.text-overline'), { 'font-size': '0.75rem', 'line-height': '1rem', 'letter-spacing': '0', 'font-weight': '500' });
  });

  test('.dateline = mono + tabular figures + meta size + muted color', async () => {
    const d = declsFor(await compileGlobals(), '.dateline');
    assert.match(d['font-family'], /^IBM Plex Mono, Pretendard Variable, Pretendard, ui-monospace/);
    assert.equal(d['font-size'], '0.75rem');
    assert.equal(d['line-height'], '1rem');
    assert.equal(d['font-weight'], '400');
    assert.equal(d['--tw-numeric-spacing'], 'tabular-nums');
    assert.match(d.color, /^rgb\(145 139 129/); // text-muted #918b81
  });

  test('.img-standin prints stand-in photos in greyscale', async () => {
    assert.deepEqual(declsFor(await compileGlobals(), '.img-standin'), { filter: 'grayscale(1) contrast(1.05) brightness(0.65)' });
  });

  test('one focus ring: 2px accent outline, 2px offset', async () => {
    assert.deepEqual(declsFor(await compileGlobals(), ':focus-visible'), { outline: '2px solid #f0883e', 'outline-offset': '2px' });
  });

  test('transitions use the one easing at 150ms; nav hover stays neutral', async () => {
    const root = await compileGlobals();
    const t = declsFor(root, '.transition-colors');
    assert.equal(t['transition-timing-function'], EASE);
    assert.equal(t['transition-duration'], '150ms');
    assert.equal(declsFor(root, '.duration-400')['transition-duration'], '400ms');
    assert.match(declsFor(root, '.animate-fade-in').animation, /^fade-in 400ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
  });

  test('b / strong / th default to weight 500 (browser default 700 is outside the contract)', async () => {
    const root = await compileGlobals();
    for (const sel of ['b', 'strong', 'th']) assert.equal(declsFor(root, sel)['font-weight'], '500', sel);
    // base layer: a weight utility still wins
    assert.equal(declsFor(root, '.font-semibold')['font-weight'], '600');
  });

  test('placeholders stay on the ramp: text-muted, not preflight gray-400', async () => {
    const root = await compileGlobals();
    // preflight's gray-400 rule has the same selector; declsFor keeps the LAST declaration, i.e. the one that wins
    for (const sel of ['input::placeholder', 'textarea::placeholder']) assert.equal(declsFor(root, sel).color, '#918b81', sel);
  });

  test('a lone duration-* still transitions named properties on the one easing', async () => {
    const root = await compileGlobals();
    const all = declsFor(root, '*');
    assert.equal(all['transition-timing-function'], EASE);
    assert.equal(all['transition-property'], 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, transform');
    assert.doesNotMatch(all['transition-property'], /\ball\b/);
    // no default duration: an element without a transition class does not move
    assert.equal(all['transition-duration'], undefined);
    for (const sel of ['::before', '::after']) assert.equal(declsFor(root, sel)['transition-timing-function'], EASE, sel);
  });

  test('a ring without a color class is accent, never blue', async () => {
    const css = (await compileGlobals()).toString();
    assert.match(css, /--tw-ring-color:\s*rgb\(240 136 62 \/ 0\.5\)/);
    assert.doesNotMatch(css, /59 130 246/);
  });

  test('prefers-reduced-motion still stops animations and transitions', async () => {
    let found = false;
    (await compileGlobals()).walkAtRules('media', (m) => {
      if (!m.params.includes('prefers-reduced-motion')) return;
      const text = m.toString();
      found = /animation-duration:\s*0\.01ms\s*!important/.test(text) && /transition-duration:\s*0\.01ms\s*!important/.test(text);
    });
    assert.ok(found);
  });
});
