import type { Config } from 'tailwindcss';

// Token contract: UNSLOP-AUDIT.md §3 (values) and §7 (amendments, which win).

/**
 * Hairlines: the text color (#efe9de) at 10% / 6%, so a line has the same strength on every
 * surface step. Single source for `border-border*` and the default border color below.
 */
const borderTokens = {
  DEFAULT: 'rgba(239,233,222,0.10)',
  muted: 'rgba(239,233,222,0.06)',
};

/** The one easing curve. `linear` exists only for continuous motion (spinner, ticker). */
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Shared modules hold class strings too (src/lib/ui.ts, CATEGORY_COLORS, …).
    // Tailwind only generates classes it finds in these files.
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './src/hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    // Closed scales — these REPLACE Tailwind's defaults, so a class outside the contract
    // (font-bold, shadow-lg, transition-all, duration-300, ease-in-out, animate-pulse, …)
    // generates no CSS at all. Colors, spacing and radius stay open (see `extend`).
    fontWeight: { normal: '400', medium: '500', semibold: '600' },
    // Depth on the dark theme = surface steps + hairlines. The one shadow is for floating menus.
    boxShadow: { none: 'none', float: '0 8px 24px rgba(0,0,0,0.35)' },
    transitionTimingFunction: { DEFAULT: EASE, linear: 'linear' },
    // 150ms hover / press, 200ms menus, 400ms entrance.
    transitionDuration: { DEFAULT: '150ms', 0: '0ms', 150: '150ms', 200: '200ms', 400: '400ms' },
    // Named properties only (no `all`); arbitrary lists like transition-[transform,opacity] still work.
    transitionProperty: {
      none: 'none',
      DEFAULT: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, transform',
      colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
      opacity: 'opacity',
      transform: 'transform',
    },
    keyframes: {
      spin: { to: { transform: 'rotate(360deg)' } },
      // Ends on `transform: none` so no stacking context is left behind after the entrance.
      'fade-in': {
        from: { opacity: '0', transform: 'translateY(8px)' },
        to: { opacity: '1', transform: 'none' },
      },
    },
    animation: {
      none: 'none',
      spin: 'spin 1s linear infinite',
      // Fade + 8px rise. Defined for menus; pages use no entrance animation (§7-9).
      'fade-in': `fade-in 400ms ${EASE} backwards`,
    },
    extend: {
      colors: {
        // One warm neutral ramp (paper and ink).
        surface: { deep: '#12110f', DEFAULT: '#161513', card: '#1c1a18', elevated: '#262421' },
        // muted: meta and captions only. #918b81 keeps 4.5:1 on every surface step (§7-1).
        text: { DEFAULT: '#efe9de', secondary: '#aaa398', muted: '#918b81' },
        // The one accent: current position and the one primary action. `ink` = text on an accent or live fill.
        accent: { DEFAULT: '#f0883e', ink: '#161513' },
        // Meaning-only colors. #ea5d61 keeps 4.5:1 as text on every surface step (§7-2).
        live: '#ea5d61', // breaking / live
        positive: '#4cc38a', // success
        negative: '#ea5d61', // error
        border: borderTokens,
      },
      // Preflight paints every border without a color class with borderColor.DEFAULT.
      // Tailwind's default is gray-200 (#e5e7eb), a light-theme line on our dark surfaces.
      borderColor: { DEFAULT: borderTokens.DEFAULT },
      fontFamily: {
        // Interface.
        sans: [
          'Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont',
          'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial',
          'Noto Sans KR', 'sans-serif',
        ],
        // The two large headlines only: home lead title, article h1.
        serif: ['Noto Serif KR', 'AppleMyungjo', 'Nanum Myeongjo', 'Batang', 'serif'],
        // Times, figures, counts. Plex Mono has no Hangul, so Pretendard follows it:
        // digits and Latin come from Plex Mono, a unit like '건' from Pretendard (§7-3).
        mono: ['IBM Plex Mono', 'Pretendard Variable', 'Pretendard', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Fluid: 28px (= headline-lg) up to 440px wide → ≈34.6px at 768px → 40px from 1040px.
        // rem + vw so browser zoom still enlarges it. The only size at weight 600.
        'headline-xl': ['clamp(1.75rem, 1.2rem + 2vw, 2.5rem)', { lineHeight: '1.2', fontWeight: '600' }],
        'headline-lg': ['1.75rem', { lineHeight: '1.25', fontWeight: '500' }],
        'headline-md': ['1.25rem', { lineHeight: '1.35', fontWeight: '500' }],
        'headline-sm': ['1rem', { lineHeight: '1.45', fontWeight: '500' }],
        'body-lg': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
        // Sentence-case label: never combined with uppercase or tracking.
        overline: ['0.75rem', { lineHeight: '1rem', fontWeight: '500', letterSpacing: '0' }],
        // Times and counts, with `font-mono tabular-nums` (see .dateline in globals.css).
        meta: ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
      },
      borderRadius: {
        tag: '0.375rem', // 6px
        control: '0.5rem', // 8px — buttons, inputs, chips
        card: '0.75rem', // 12px
        panel: '1rem', // 16px
        // Deprecated aliases, still referenced outside this slice. New code uses
        // rounded-tag / rounded-control; a real circle is rounded-full.
        badge: '0.375rem', // = tag
        pill: '0.5rem', // = control
      },
    },
  },
  plugins: [],
};

export default config;
