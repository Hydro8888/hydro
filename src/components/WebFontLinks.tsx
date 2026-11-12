'use client';

import { useEffect } from 'react';

/**
 * Fallback for the inline font script in app/layout.tsx.
 * A 404 response is an empty shell that the browser renders itself, and a <script> that React
 * creates in the browser never runs — without this, 404 pages would stay on the fallback fonts.
 * After mount it adds any font stylesheet that is still missing. On server-rendered pages the
 * inline script has already added them, so this does nothing there.
 */
export default function WebFontLinks({ hrefs }: { hrefs: readonly string[] }) {
  useEffect(() => {
    const present = Array.from(document.querySelectorAll('link[data-webfonts]'), (l) => l.getAttribute('href'));
    for (const href of hrefs) {
      if (present.includes(href)) continue;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-webfonts', '');
      document.head.appendChild(link);
    }
  }, [hrefs]);

  return null;
}
