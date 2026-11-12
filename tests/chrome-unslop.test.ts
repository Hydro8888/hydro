/**
 * Site chrome invariants (slice S2: header, footer, search, admin bar, skeleton, error screens).
 * Run: npm test
 * Static: the source files are read as text, so a banned pattern fails here before it reaches a
 * browser. Contract: UNSLOP-AUDIT.md §3 and §7 (§7 wins), SPEC-S2.md.
 * The rules look at whole files, comments included.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
/** Every .tsx file under a directory, as repo-relative paths. */
function tsxFiles(dir: string): string[] {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return tsxFiles(rel);
    return entry.name.endsWith('.tsx') ? [rel] : [];
  });
}

const ICONS = 'src/components/icons.tsx';
const UI = 'src/lib/ui.ts';
const CHROME = [
  'src/components/Header.tsx',
  'src/components/Footer.tsx',
  'src/components/SearchBar.tsx',
  'src/components/AdminNav.tsx',
  'src/components/PageSkeleton.tsx',
  'src/components/WebFontLinks.tsx',
  ICONS,
  UI,
  'src/app/layout.tsx',
  'src/app/error.tsx',
  'src/app/not-found.tsx',
  'src/app/admin/layout.tsx',
];

// RegExp constructor where the pattern needs lookbehind or the u flag (the tsconfig target has no such literals).
const BANNED: { name: string; re: RegExp; except?: string[] }[] = [
  { name: 'uppercase / tracking / italic', re: /\buppercase\b|\btracking-|\bitalic\b/ },
  { name: 'weight 700+', re: /\bfont-(bold|extrabold|black)\b|<strong\b/ },
  { name: 'looping or entrance animation', re: /\banimate-|\bshimmer\b/ },
  {
    name: 'catch-all or layout transitions',
    re: /transition-all|hover:scale|ease-in-out|duration-300|transition-\[[^\]]*(height|padding|width|margin)/,
  },
  // icons.tsx is exempt: SVG path data looks like a half step ('l-7.5').
  { name: 'half-step spacing', re: /[a-z]-[1-9]\d*\.5\b/, except: [ICONS] },
  // Allowed: focus:z-[100], max-h-[calc(…)] (keeps the mobile menu inside the viewport), transition-[transform,opacity]
  { name: 'arbitrary values', re: new RegExp('(?<!z)-\\[(?!calc\\(|transform,opacity\\])') },
  { name: 'removed colors', re: /accent-(blue|red|green)/ },
  // Tailwind's default palette is still generated (the token colors only extend it), so a stray
  // text-green-400 or bg-white would render. Chrome colors are the tokens only.
  {
    name: 'default palette colors',
    re: /\b(text|bg|border|fill|stroke|decoration|outline)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|white|black)\b/,
  },
  // The live red means "breaking / live" and belongs to the ticker (S3). The chrome never uses it:
  // no dot beside the wordmark, no live label in the header or footer. ui.ts is shared with the
  // other slices and is not chrome markup, so it is exempt.
  { name: 'live red in the chrome', re: /\b(bg|text|border)-live\b/, except: [UI] },
  { name: 'accent outside "current location"', re: /bg-accent|hover:text-accent|text-accent\// },
  { name: 'blur / gradient / old shadows', re: /backdrop-blur|\bblur-|bg-gradient|shadow-(card|elevated|dropdown)/ },
  // ui.ts keeps one real circle: the 8px status dot of the admin tables.
  { name: 'pills and circles', re: /rounded-(pill|badge|full)/, except: [UI] },
  // Radii are rounded-tag / -control / -card / -panel (6 / 8 / 12 / 16px). Bare `rounded` is 4px.
  {
    name: 'radii outside the contract',
    re: /\brounded(-[trblse]{1,2})?(-(sm|md|lg|xl|2xl|3xl))?(?![-\w])/,
  },
  // 14px text is text-body-md (one line height); 12px is text-caption / text-meta / text-overline.
  { name: 'type sizes outside the tokens', re: /\btext-(xs|sm)\b/ },
  // 16px is the size of field text below lg only (FIELD / FIELD_SM in ui.ts: under 16px iOS Safari zooms on focus).
  { name: '16px text outside the fields', re: /\btext-base\b/, except: [UI] },
  // The one focus indicator is the global :focus-visible outline. main#main (programmatic focus target) may drop it.
  { name: 'local focus rings', re: new RegExp('focus:ring|\\bring-|(?<!focus:)outline-none') },
  { name: 'locale-dependent numbers', re: /toLocaleString/ },
  { name: 'old nav classes', re: /nav-link/ },
  { name: 'emoji', re: new RegExp('\\p{Extended_Pictographic}', 'u') },
  { name: 'inline svg outside the icon set', re: /<svg\b/, except: [ICONS] },
];

describe('site chrome — banned patterns (unslop passes 1-9)', () => {
  for (const { name, re, except = [] } of BANNED) {
    test(`no ${name}`, () => {
      for (const file of CHROME) {
        if (except.includes(file)) continue;
        const hit = read(file)
          .split('\n')
          .findIndex((line) => re.test(line));
        assert.equal(hit, -1, `${file}:${hit + 1} matches ${re}`);
      }
    });
  }
});

describe('site chrome — icons', () => {
  const src = read(ICONS);

  test('one stroke width and one box size', () => {
    // Later slices add icons to this file; every base <svg> keeps the same box and stroke.
    assert.deepEqual(Array.from(new Set(src.match(/strokeWidth=\{[^}]*\}/g))), ['strokeWidth={1.5}']);
    assert.deepEqual(Array.from(new Set(src.match(/className="[^"]*"/g))), ['className="h-4 w-4 shrink-0"']);
    assert.match(src, /stroke="currentColor"/);
    // Server and client components both import it, so it carries no client directive.
    assert.doesNotMatch(src, /^'use client'/m);
  });

  test('icons are named exports, and every exported icon is used somewhere', () => {
    const exported = Array.from(src.matchAll(/^export function (\w+Icon)\(/gm), (m) => m[1]);
    for (const name of ['SearchIcon', 'MenuIcon', 'CloseIcon', 'HomeIcon', 'BoltIcon', 'GlobeIcon', 'ExternalIcon', 'MailIcon', 'CheckIcon'])
      assert.ok(exported.includes(name), `${name} is exported`);
    assert.doesNotMatch(src, /export default/);
    const users = tsxFiles('src')
      .filter((file) => file !== ICONS)
      .map(read)
      .join('\n');
    for (const name of exported) assert.match(users, new RegExp(`<${name}\\b`), `${name} is used`);
  });
});

describe('site chrome — web fonts (render must not wait for a font host)', () => {
  const src = read('src/app/layout.tsx');

  test('stylesheet URLs', () => {
    assert.ok(
      src.includes(
        "'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600&family=IBM+Plex+Mono:wght@400;500&display=swap'",
      ),
    );
    assert.ok(
      src.includes(
        "'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'",
      ),
    );
  });

  test('links are inserted by script; the only static stylesheet links sit inside <noscript>', () => {
    assert.match(src, /document\.createElement\('link'\)/);
    assert.match(src, /<script dangerouslySetInnerHTML=\{\{ __html: WEB_FONTS_SCRIPT \}\} \/>/);
    assert.equal((src.match(/<noscript>/g) ?? []).length, 1);
    const noscript = src.slice(src.indexOf('<noscript>'), src.indexOf('</noscript>'));
    assert.equal((src.match(/rel="stylesheet"/g) ?? []).length, 2);
    assert.equal((noscript.match(/rel="stylesheet"/g) ?? []).length, 2);
    // No blocking variants: build-time download, print-media swap (hydration mismatch), CSS import
    assert.doesNotMatch(src, /next\/font|media="print"/);
    assert.doesNotMatch(read('src/app/globals.css'), /@import/);
  });

  test('404 shells are rendered by the browser, where the inline script never runs: a mounted fallback adds the same links', () => {
    assert.match(src, /<WebFontLinks hrefs=\{FONT_STYLESHEETS\} \/>/);
    assert.match(src, /const FONT_STYLESHEETS = \[PRETENDARD_URL, WEB_FONTS_URL\];/);
    const fallback = read('src/components/WebFontLinks.tsx');
    assert.match(fallback, /^'use client';/);
    assert.match(fallback, /useEffect\(/);
    // Same marker as the inline script, so a stylesheet is never added twice.
    assert.match(src, /setAttribute\('data-webfonts',''\)/);
    assert.match(fallback, /querySelectorAll\('link\[data-webfonts\]'\)/);
    assert.match(fallback, /setAttribute\('data-webfonts', ''\)/);
  });

  test('preconnect to the three font hosts', () => {
    const pre = Array.from(
      src.matchAll(/<link rel="preconnect" href="([^"]+)"( crossOrigin="anonymous")? \/>/g),
      (m) => m[1] + (m[2] ? ' cors' : ''),
    );
    assert.deepEqual(pre, [
      'https://cdn.jsdelivr.net cors',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com cors',
    ]);
  });

  test('theme color is the surface token', () => {
    assert.match(src, /themeColor: '#161513'/);
  });
});

describe('site chrome — wordmark, container, footer facts', () => {
  const header = read('src/components/Header.tsx');
  const footer = read('src/components/Footer.tsx');
  const WORDMARK = 'LiveNews<span className="text-text-secondary">.co.kr</span>';

  test('wordmark: LiveNews in the text color, .co.kr in the secondary text color (§7-16)', () => {
    assert.ok(header.includes(WORDMARK));
    assert.ok(footer.includes(WORDMARK));
    assert.equal(header.split('.co.kr').length - 1, 1);
    // Footer: the wordmark, and the mail address (href + label)
    assert.equal(footer.split('.co.kr').length - 1, 3);
    // One size, weight and color for the wordmark in the header, the footer and the admin bar.
    const type = 'text-lg font-semibold text-text';
    assert.match(header, new RegExp(`className="[^"]* ${type}">\\s*LiveNews<span`));
    assert.match(footer, new RegExp(`className="[^"]* ${type}">\\s*LiveNews<span`));
    assert.match(read('src/app/admin/layout.tsx'), new RegExp(`className="whitespace-nowrap ${type}">\\s*LiveNews Admin`));
  });

  test('admin content starts 32px under its bar, like the public pages under the header', () => {
    assert.match(read('src/app/admin/layout.tsx'), /<div className=\{cn\(CONTAINER, 'py-8'\)\}>\{children\}<\/div>/);
  });

  test('field text is text-base below lg and text-body-md from lg, nothing else', () => {
    const ui = read(UI);
    assert.equal(ui.split('text-base').length - 1, 2);
    assert.equal((ui.match(/text-base text-text [^']*lg:text-body-md';/g) ?? []).length, 2);
  });

  test('one page container for header, footer, admin bar and skeleton: CONTAINER from src/lib/ui.ts (§7-6)', () => {
    assert.ok(read(UI).includes("export const CONTAINER = 'mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8';"));
    for (const file of ['src/components/Header.tsx', 'src/components/Footer.tsx', 'src/components/PageSkeleton.tsx', 'src/app/admin/layout.tsx']) {
      const src = read(file);
      assert.match(src, /import \{[^}]*\bCONTAINER\b[^}]*\} from '@\/lib\/ui';/, `${file} imports the shared container`);
      assert.match(src, /className=\{(cn\()?CONTAINER\b/, `${file} uses the shared container`);
      // No local copy of the string, no other page width.
      assert.doesNotMatch(src, /max-w-screen-|max-w-7xl|const CONTAINER\b/, `${file} has no page container of its own`);
    }
  });

  test('a link appears once in the footer: quick links leave out the category pages listed above them', () => {
    assert.match(footer, /!m\.href\.startsWith\('\/category\/'\)/);
    // One spelling of the interpunct in running text: no spaces around it.
    assert.doesNotMatch(footer, /번역 · 요약/);
  });

  test('footer links only what can be verified (§7-17), and says the AI fact once as a plain sentence', () => {
    assert.equal(footer.split('mailto:contact@livenews.co.kr').length - 1, 1);
    assert.doesNotMatch(footer, /github\.com|twitter\.com|x\.com/);
    assert.equal(footer.split('OpenAI').length - 1, 1);
    assert.doesNotMatch(footer, /운영 중|매일 아침|선별/);
    assert.match(footer, /suppressHydrationWarning/);
  });

  test('shared control classes come from src/lib/ui.ts (§7-15)', () => {
    assert.equal(fs.existsSync(path.join(ROOT, 'src/components/ui.ts')), false);
    for (const file of ['src/components/SearchBar.tsx', 'src/components/Footer.tsx', 'src/app/error.tsx', 'src/app/not-found.tsx'])
      assert.match(read(file), /from '@\/lib\/ui'/, file);
  });
});

describe('site chrome — fixed chrome never covers keyboard focus (WCAG 2.4.11)', () => {
  const header = read('src/components/Header.tsx');

  test('the document reserves the sticky header and the bottom tab bar when focus scrolls', () => {
    // 96px ≥ header (48 + 1 + 40 + 1), 64px ≥ tab bar (56 + 1); no tab bar from lg up.
    assert.match(read('src/app/layout.tsx'), /<html lang="ko" className="dark scroll-pt-24 scroll-pb-16 lg:scroll-pb-0">/);
    assert.match(header, /lg:hidden">\s*<nav aria-label="하단 탭 메뉴"/);
  });

  test('the header never collapses while keyboard focus is inside it; collapsed, nothing is left below lg', () => {
    assert.match(header, /const collapsed = scrollDir === 'down' && !mobileOpen && !searchOpen && !focusWithin;/);
    assert.match(header, /collapsed && '-translate-y-full lg:-translate-y-12'/);
  });

  test('the country flyout closes when focus leaves it', () => {
    const li = header.slice(header.indexOf('ref={countryRef}'), header.indexOf('ref={countryBtnRef}'));
    assert.match(li, /onBlur=\{/);
    assert.match(li, /!e\.currentTarget\.contains\(next\)\) setCountryOpen\(false\)/);
  });
});

describe('site chrome — loading boundaries', () => {
  test('segment loading files re-export the skeleton; there is no root loading.tsx (it would turn 404s into 200s)', () => {
    for (const file of ['src/app/breaking/loading.tsx', 'src/app/ranking/loading.tsx', 'src/app/category/[slug]/loading.tsx'])
      assert.equal(read(file).trim(), "export { default } from '@/components/PageSkeleton';");
    assert.equal(fs.existsSync(path.join(ROOT, 'src/app/loading.tsx')), false);
  });

  test('the skeleton keeps its live-region semantics', () => {
    const src = read('src/components/PageSkeleton.tsx');
    assert.match(src, /role="status"/);
    assert.match(src, /aria-live="polite"/);
    assert.match(src, /aria-busy="true"/);
    assert.match(src, /className="sr-only"/);
  });
});
