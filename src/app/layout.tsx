import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WebFontLinks from '@/components/WebFontLinks';

// Web fonts, all fetched at runtime (the build never touches the network):
// Pretendard — the interface face (dynamic subset: the browser downloads only the glyph ranges a page uses);
// Noto Serif KR — the two large headlines; IBM Plex Mono — times, figures, counts.
const PRETENDARD_URL =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const WEB_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600&family=IBM+Plex+Mono:wght@400;500&display=swap';
const FONT_STYLESHEETS = [PRETENDARD_URL, WEB_FONTS_URL];

// A <link> inserted by script never blocks rendering, and the server HTML carries no attribute for
// React to compare at hydration. If a font host is slow or down, the page paints at once in the
// fallback fonts of each stack (tailwind.config.ts) and swaps when the stylesheet arrives.
// <WebFontLinks> repeats this after mount for 404 pages, where this script is never run.
const WEB_FONTS_SCRIPT = `(function(){${JSON.stringify(
  FONT_STYLESHEETS,
)}.forEach(function(h){var l=document.createElement('link');l.rel='stylesheet';l.href=h;l.setAttribute('data-webfonts','');document.head.appendChild(l)})})()`;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // = surface token (page background)
  themeColor: '#161513',
};

export const metadata: Metadata = {
  title: {
    default: 'LiveNews - 글로벌 라이브 뉴스',
    template: '%s | LiveNews',
  },
  description: '전 세계 주요 뉴스를 한국어로 번역·요약해 전하는 뉴스 서비스',
  icons: {
    icon: [
      { url: '/livenews/favicon.ico', sizes: '48x48' },
      { url: '/livenews/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/livenews/apple-touch-icon.png',
  },
  openGraph: {
    title: 'LiveNews - 글로벌 라이브 뉴스',
    description: '세계·미국·일본·중국 주요 뉴스를 한 화면에서',
    type: 'website',
    siteName: 'LiveNews',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // scroll-padding: when focus scrolls an element into view, it stops clear of the sticky header
  // (90px with the nav strip) and, below lg, of the fixed bottom tab bar (57px).
  return (
    <html lang="ko" className="dark scroll-pt-24 scroll-pb-16 lg:scroll-pb-0">
      <head>
        {/* Font files come from cdn.jsdelivr.net (Pretendard) and fonts.gstatic.com; both are CORS fetches */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: WEB_FONTS_SCRIPT }} />
        <noscript>
          <link rel="stylesheet" href={PRETENDARD_URL} />
          <link rel="stylesheet" href={WEB_FONTS_URL} />
        </noscript>
      </head>
      <body className="bg-surface text-text min-h-screen flex flex-col overflow-x-hidden">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[100] focus:inline-flex focus:h-10 focus:items-center focus:rounded-control focus:bg-text focus:px-4 focus:text-body-md focus:font-medium focus:text-accent-ink"
        >
          본문 바로가기
        </a>
        <Header />
        {/* No streaming boundary / root loading.tsx here: any boundary above a notFound() call
            flushes the shell first and turns every 404 into HTTP 200 (see SPEC-S2 contract D). */}
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
        <WebFontLinks hrefs={FONT_STYLESHEETS} />
      </body>
    </html>
  );
}
