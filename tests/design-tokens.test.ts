/**
 * Design-system invariants (slice S1). Run: npm test
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
import {
  BREAKING_ITEMS_PER_PAGE,
  CATEGORIES,
  CATEGORY_COLORS,
  IMAGE_PLACEHOLDER_SRC,
  ITEMS_PER_PAGE,
  MAX_PAGE,
} from '../src/lib/constants';
import { getCategoryStyle } from '../src/lib/utils';

const ROOT = path.resolve(__dirname, '..');

type Tokens = Record<string, string>;
const extend = (config.theme?.extend ?? {}) as unknown as {
  colors: Record<string, Tokens>;
  borderColor: Tokens;
  fontSize: Record<string, [string, Tokens]>;
};

const FALLBACK_STYLE = { border: 'border-l-gray-500', text: 'text-text-secondary', bg: 'bg-surface-elevated', borderAll: 'border-gray-500' };

// ---------------------------------------------------------------------------

describe('category styles (S1-A)', () => {
  const slugs = CATEGORIES.map((c) => c.slug);

  test('CATEGORY_COLORS covers exactly the 16 categories', () => {
    assert.equal(slugs.length, 16);
    assert.deepEqual(Object.keys(CATEGORY_COLORS).sort(), [...slugs].sort());
  });

  test('every category: border / text / bg / borderAll with consistent colors', () => {
    for (const slug of slugs) {
      const s = getCategoryStyle(slug);
      assert.deepEqual(Object.keys(s).sort(), ['bg', 'border', 'borderAll', 'text'], slug);
      assert.match(s.border, /^border-l-[a-z]+-\d{3}$/, slug);
      assert.match(s.text, /^text-[a-z]+-\d{3}$/, slug);
      assert.match(s.bg, /^bg-[a-z]+-\d{3}\/\d{1,2}$/, slug);
      assert.equal(s.borderAll, s.border.replace('border-l-', 'border-'), slug);
    }
  });

  test('unknown slug → unchanged neutral fallback, plus borderAll matching its border', () => {
    for (const slug of ['quantum-weird-category', 'international-politics', '', 'constructor', '__proto__']) {
      const s = getCategoryStyle(slug);
      assert.deepEqual(s, FALLBACK_STYLE, JSON.stringify(slug));
      assert.equal(s.borderAll, s.border.replace('border-l-', 'border-'));
    }
  });

  test('every class is a complete string literal in constants.ts', () => {
    const src = fs.readFileSync(path.join(ROOT, 'src/lib/constants.ts'), 'utf8');
    for (const style of Object.values(CATEGORY_COLORS)) {
      for (const cls of Object.values(style)) assert.ok(src.includes(`'${cls}'`), `${cls} is not a literal`);
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

  test('default border color = border token (not Tailwind gray-200)', () => {
    assert.equal(extend.borderColor.DEFAULT, extend.colors.border.DEFAULT);
    assert.equal(extend.borderColor.DEFAULT, '#30363d');
  });

  test('headline-xl is fluid between 1.75rem and 2.5rem; line-height / weight unchanged', () => {
    const [size, opts] = extend.fontSize['headline-xl'];
    assert.ok(size.startsWith('clamp('), size);
    assert.ok(size.includes('1.75rem') && size.includes('2.5rem'), size);
    assert.deepEqual(opts, { lineHeight: '1.15', fontWeight: '800' });
    // the mobile floor equals headline-lg, so the type scale never inverts
    assert.equal(extend.fontSize['headline-lg'][0], '1.75rem');
  });

  test('dark palette snapshot is unchanged', () => {
    assert.deepEqual(extend.colors.surface, { DEFAULT: '#0d1117', card: '#161b22', elevated: '#21262d' });
    assert.deepEqual(extend.colors.text, { DEFAULT: '#e6edf3', secondary: '#8b949e', muted: '#6e7681' });
    assert.deepEqual(extend.colors.accent, { DEFAULT: '#f0883e', blue: '#58a6ff', red: '#f85149', green: '#3fb950' });
    assert.deepEqual(extend.colors.border, { DEFAULT: '#30363d', muted: '#21262d' });
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

let compiled: Promise<Root> | undefined;
/** globals.css → Tailwind (project config, content globs resolved from the repo root). */
function compileGlobals(): Promise<Root> {
  compiled ??= (async () => {
    const from = path.join(ROOT, 'src/app/globals.css');
    const content = (config.content as string[]).map((glob) => path.resolve(ROOT, glob));
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

describe('generated CSS (globals.css + tailwind.config.ts)', () => {
  test('every category class and the fallback classes exist', async () => {
    const root = await compileGlobals();
    const selectors = new Set<string>();
    root.each((node) => {
      if (node.type === 'rule') node.selectors.forEach((s) => selectors.add(s.trim()));
    });
    const classes = [...Object.values(CATEGORY_COLORS), FALLBACK_STYLE].flatMap((s) => Object.values(s));
    const missing = classes.filter((cls) => !selectors.has(classSelector(cls)));
    assert.deepEqual(missing, [], `not generated: ${missing.join(' ')}`);
    assert.equal(classes.length, 68); // 17 styles x 4 classes
  });

  test('preflight paints uncolored borders with the dark token', async () => {
    assert.equal(declsFor(await compileGlobals(), '*')['border-color'], '#30363d');
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

  test('.text-headline-xl compiles to the fluid clamp()', async () => {
    assert.equal(declsFor(await compileGlobals(), '.text-headline-xl')['font-size'], 'clamp(1.75rem, 1.2rem + 2vw, 2.5rem)');
  });
});
