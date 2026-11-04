/**
 * paragraphs.ts
 * Readable paragraphs for article bodies.
 *
 * Many sources hand us the whole article as ONE block (RSS bodies were
 * whitespace-collapsed, JSON-LD articleBody often has no line breaks), and the
 * translation keeps that shape — so pages showed 3,000+ characters as a single
 * wall of text. reflowParagraphs() splits overly long paragraphs at sentence
 * boundaries into groups of a few sentences. Text is never changed or dropped:
 * joining the output with spaces gives back the input words in order.
 *
 * Pure (no DOM / Node APIs) — shared by the article page and the workers.
 */

/** A paragraph longer than this is split. */
export const LONG_PARAGRAPH_CHARS = 420;
/** Aim for paragraphs of about this length … */
export const TARGET_PARAGRAPH_CHARS = 260;
/** … and never let one grow past this while a sentence boundary is available. */
export const MAX_PARAGRAPH_CHARS = 480;
/** A trailing group shorter than this is merged into the previous paragraph. */
const MIN_TAIL_CHARS = 80;

// Words after which a period does NOT end a sentence ("Mr. Kim", "U.S. troops", "Jan. 5").
const ABBREVIATIONS = new Set(
  [
    'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'mt', 'ft', 'gen', 'gov', 'sen', 'rep', 'lt', 'col',
    'capt', 'cmdr', 'sgt', 'pres', 'rev', 'hon', 'inc', 'ltd', 'co', 'corp', 'vs', 'etc', 'no', 'nos', 'vol',
    'fig', 'approx', 'dept', 'est', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct',
    'nov', 'dec', 'e.g', 'i.e', 'u.s', 'u.k', 'u.n', 'e.u', 'd.c', 'a.m', 'p.m', 'u.s.a', 'ph.d',
  ],
);

const CLOSERS = `"'”’」』）)]›»`;
const OPENERS = `"'“‘「『（(\\[‹«`;
// End punctuation (+ optional closing quotes/brackets), then whitespace.
const BOUNDARY_RE = new RegExp(`([.!?…。！？]+[${CLOSERS.replace(/[\]\\]/g, '\\$&')}]*)(\\s+)`, 'g');

// Uppercase / caseless letters (Hangul, CJK) and digits can start a sentence.
const SENTENCE_START_RE = new RegExp('[\\p{Lu}\\p{Lo}\\p{N}]', 'u');

// Particles that attach to a closing quote and continue the same sentence.
const QUOTE_PARTICLE_RE = /^(?:이?라고|이?라며|이?라는|이?란|하고|하며|고|며|는|은|라)(?=[\s,.]|$)/;

/** True when the text before a "." ends with an abbreviation or a single-letter initial. */
function endsWithAbbreviation(before: string): boolean {
  const m = before.match(/([A-Za-z][A-Za-z.]*)\.$/);
  if (!m) return false;
  const word = m[1].toLowerCase();
  if (/^[a-z]$/.test(word)) return true; // initials: "J. K. Rowling"
  return ABBREVIATIONS.has(word);
}

/**
 * Splits one paragraph into sentences. A boundary is end punctuation followed by
 * whitespace and a character that can start a sentence (not a lowercase Latin
 * letter), unless the period closes an abbreviation or an initial.
 */
export function splitSentences(paragraph: string): string[] {
  const text = paragraph.trim();
  if (!text) return [];
  const sentences: string[] = [];
  let start = 0;
  BOUNDARY_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BOUNDARY_RE.exec(text)) !== null) {
    const endOfPunct = m.index + m[1].length;
    const next = text.charAt(endOfPunct + m[2].length);
    if (!next) break;
    if (/[a-z]/.test(next)) continue; // "e.g. something", "3 p.m. today"
    if (!(SENTENCE_START_RE.test(next) || OPENERS.includes(next))) continue;
    if (m[1].startsWith('.') && m[1].length === 1 && endsWithAbbreviation(text.slice(start, m.index + 1))) continue;
    // Korean quoted speech continues after the closing quote: “끝났다.” 라고 말했다 / “…!” 며
    if (/[”’"'」』]$/.test(m[1]) && QUOTE_PARTICLE_RE.test(text.slice(endOfPunct + m[2].length))) continue;
    sentences.push(text.slice(start, endOfPunct).trim());
    start = endOfPunct + m[2].length;
  }
  const rest = text.slice(start).trim();
  if (rest) sentences.push(rest);
  return sentences;
}

/** Groups sentences into paragraphs of roughly TARGET_PARAGRAPH_CHARS. */
function groupSentences(sentences: string[]): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  let len = 0;
  for (const s of sentences) {
    if (cur.length > 0 && (len >= TARGET_PARAGRAPH_CHARS || len + s.length > MAX_PARAGRAPH_CHARS)) {
      out.push(cur.join(' '));
      cur = [];
      len = 0;
    }
    cur.push(s);
    len += s.length + (cur.length > 1 ? 1 : 0);
  }
  if (cur.length > 0) {
    const tail = cur.join(' ');
    if (out.length > 0 && tail.length < MIN_TAIL_CHARS) out[out.length - 1] += ` ${tail}`;
    else out.push(tail);
  }
  return out;
}

/** Splits one paragraph if it is too long to read comfortably; short ones are returned as-is. */
export function reflowParagraph(paragraph: string): string[] {
  const p = paragraph.trim();
  if (!p) return [];
  if (p.length <= LONG_PARAGRAPH_CHARS) return [p];
  const sentences = splitSentences(p);
  return sentences.length <= 1 ? [p] : groupSentences(sentences);
}

/** Paragraph list → paragraph list, long ones split at sentence boundaries. */
export function reflowParagraphList(paragraphs: string[]): string[] {
  return paragraphs.flatMap(reflowParagraph);
}

/** Text with '\n' paragraphs → same, long paragraphs split. Blank lines are dropped. */
export function reflowParagraphs(text: string | null | undefined): string {
  if (typeof text !== 'string') return '';
  return reflowParagraphList(text.split('\n')).join('\n');
}
