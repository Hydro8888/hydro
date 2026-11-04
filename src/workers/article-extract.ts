/**
 * article-extract.ts
 * Full article text from a news page.
 *
 * The old regex extractor returned the JSON-LD `description` (a ~100-char
 * summary) whenever a page had one and never looked further, so most sources
 * were stored as a teaser (Al Jazeera 103 chars instead of 2,577). This uses
 * Mozilla Readability — the engine behind Firefox Reader View — on a
 * lightweight DOM (linkedom), keeps the paragraph structure and drops
 * boilerplate lines ("watch now", "Subscribe…", "You can now listen…").
 *
 * Relative imports only — the tsx worker runtime has no `@/` alias.
 */

import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';

/** A scraped body must be at least this long to replace what is stored (teasers are shorter). */
export const MIN_SCRAPED_BODY_CHARS = 500;

/**
 * Pure: should a freshly scraped body replace the stored one? Only when it is a
 * real article (≥ MIN_SCRAPED_BODY_CHARS) and clearly longer — a paywall footer
 * or a shorter extraction never overwrites the feed's text.
 */
export function shouldReplaceBody(stored: string | null | undefined, scraped: string | null | undefined): boolean {
  const next = (scraped ?? '').trim();
  const cur = (stored ?? '').trim();
  if (next.length < MIN_SCRAPED_BODY_CHARS) return !cur && next.length >= 200;
  return next.length > cur.length * 1.1;
}

/** Long enough for any news article; the cut is made at a paragraph boundary. */
export const MAX_ARTICLE_CHARS = 40_000;

// Lines that are page furniture, not article text.
const BOILERPLATE_RE = new RegExp(
  [
    '^(?:watch now|watch live|listen(?: to (?:this|the) article)?|play video|advertisement|ad|sponsored)\\b',
    '^new\\s*you can now listen to',
    '^you can now listen to',
    '^(?:subscribe|sign up|sign in|log in|register)\\b',
    '^(?:read more|related|recommended|more from|most read|trending|follow us|share (?:this|on)|click here)\\b',
    '^(?:by [^.]{0,60} )?published on \\d',
    '^(?:published|updated|posted)[: ]',
    '^(?:copyright|©)',
    '^(?:image|photo|video|graphic)(?: credit)?:',
    '^this (?:article|story|report) (?:was|is|has been) (?:originally )?(?:published|updated|written)',
    'all rights reserved\\.?$',
    '^got a confidential news tip',
    '^we want to hear from you',
    '^get this delivered to your inbox',
    '^data is (?:a real-time snapshot|delayed)',
    '^(?:market data )?terms of use',
    '^(?:privacy policy|cookie (?:policy|settings))',
  ].join('|'),
  'i',
);

/** Pure: drops boilerplate and fragments, collapses whitespace, removes duplicates. */
export function cleanBodyLines(lines: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of lines) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line) continue;
    if (BOILERPLATE_RE.test(line)) continue;
    // Short fragments without sentence punctuation are labels / captions / buttons
    if (line.length < 40 && !/[.!?。！？"”]$/.test(line)) continue;
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out;
}

/** Cuts at the last paragraph that still fits — never in the middle of a sentence. */
export function capAtParagraph(text: string, max = MAX_ARTICLE_CHARS): string {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf('\n', max);
  return (cut > max * 0.5 ? text.slice(0, cut) : text.slice(0, max)).trim();
}

const BLOCK_SELECTOR = 'p, h2, h3, h4, li, blockquote, pre';

/** Main article text as '\n'-separated paragraphs, or '' when Readability finds no article. */
export function extractReadableText(html: string): string {
  if (!html) return '';
  try {
    const { document } = parseHTML(html);
    const article = new Readability(document as unknown as Document, { charThreshold: 300 }).parse();
    if (!article?.content) return '';

    const { document: body } = parseHTML(`<!doctype html><html><body>${article.content}</body></html>`);
    body.querySelectorAll('figure, figcaption, picture, aside, button, script, style, noscript, form').forEach((el) => el.remove());

    const blocks = Array.from(body.querySelectorAll(BLOCK_SELECTOR)) as Element[];
    // Leaf blocks only: an <li> wrapping a <p> would otherwise be counted twice
    const leaves = blocks.filter((el) => !el.querySelector(BLOCK_SELECTOR));
    let lines = leaves.map((el) => el.textContent ?? '');
    if (lines.join('').trim().length < 200) {
      // Text sits directly in <div>s: fall back to Readability's plain text
      lines = (article.textContent ?? '').split(/\n+/);
    }
    return capAtParagraph(cleanBodyLines(lines).join('\n'));
  } catch (err) {
    console.warn('[article-extract] Readability failed:', err instanceof Error ? err.message : err);
    return '';
  }
}

/**
 * JSON-LD article body. Only `articleBody` / `text` count — `description` is a
 * summary and was the cause of teaser-only articles.
 */
export function extractJsonLdBody(html: string): string {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let best = '';
  let m: RegExpExecArray | null;
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    const n = node as Record<string, unknown>;
    const type = String(n['@type'] ?? '');
    if (/Article|BlogPosting|Report/i.test(type)) {
      for (const field of ['articleBody', 'text']) {
        const v = n[field];
        if (typeof v === 'string' && v.length > best.length) best = v;
      }
    }
    if (Array.isArray(n['@graph'])) (n['@graph'] as unknown[]).forEach(visit);
  };
  while ((m = re.exec(html)) !== null) {
    try {
      visit(JSON.parse(m[1]));
    } catch {
      /* invalid JSON-LD block */
    }
  }
  if (!best) return '';
  const text = /<\/?(?:p|br|div)\b/i.test(best) ? extractReadableText(`<article>${best}</article>`) || best : best;
  return capAtParagraph(cleanBodyLines(text.split(/\n+/)).join('\n'));
}
