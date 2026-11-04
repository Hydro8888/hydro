/**
 * translation-text.ts
 * Pure text rules for the translation pipeline — no openai / prisma imports,
 * so every rule here is unit-tested (tests/translation-text.test.ts).
 *
 * The "is this untranslated?" predicates mirror the SQL in
 * src/lib/translation-coverage.ts one-to-one: the backfill, the CLI, the
 * fix-translations endpoint and /api/admin/health all count the same rows.
 */

import { CATEGORIES } from '../lib/constants';

const HANGUL_RE = /[가-힣]/;

export function hasHangul(s: string | null | undefined): boolean {
  return typeof s === 'string' && HANGUL_RE.test(s);
}

/** More than 20% Hangul → the text is already Korean (no API call needed). */
export function isMostlyKorean(s: string | null | undefined): boolean {
  if (!s) return false;
  const hangul = (s.match(/[가-힣]/g) || []).length;
  return hangul > s.length * 0.2;
}

// ---------------------------------------------------------------------------
// Language / category normalization
// ---------------------------------------------------------------------------

const LANGUAGE_NAMES: Record<string, string> = {
  english: 'en',
  japanese: 'ja',
  chinese: 'zh',
  korean: 'ko',
};

/** 'EN-us' → 'en', 'ja_JP' → 'ja', 'english' → 'en', '' → 'en'. */
export function normalizeLanguageTag(raw: unknown): string {
  if (typeof raw !== 'string') return 'en';
  const s = raw.trim().toLowerCase().replace(/_/g, '-');
  if (!s) return 'en';
  if (LANGUAGE_NAMES[s]) return LANGUAGE_NAMES[s];
  const primary = s.split('-')[0];
  if (!primary) return 'en';
  return LANGUAGE_NAMES[primary] ?? primary;
}

export function isKoreanLanguage(lang: unknown): boolean {
  return normalizeLanguageTag(lang) === 'ko';
}

const CATEGORY_SLUGS: ReadonlySet<string> = new Set(CATEGORIES.map((c) => c.slug));

export function isStandardCategory(slug: unknown): boolean {
  return typeof slug === 'string' && CATEGORY_SLUGS.has(slug);
}

function slugify(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

/** Model category → one of the 16 standard slugs; anything unknown → 'general'. */
export function normalizeCategorySlug(raw: unknown): string {
  const s = slugify(raw);
  return CATEGORY_SLUGS.has(s) ? s : 'general';
}

/** Secondary category: a standard slug or '' (never an invented slug). */
export function normalizeSecondaryCategory(raw: unknown): string {
  const s = slugify(raw);
  return CATEGORY_SLUGS.has(s) ? s : '';
}

// ---------------------------------------------------------------------------
// "Untranslated" predicates (mirror of translation-coverage.ts SQL)
// ---------------------------------------------------------------------------

/**
 * Title needs (re)translation:
 *  - NULL / blank always
 *  - non-Korean source: no Hangul, or identical to the original (echo)
 */
export function isUntranslatedTitle(
  titleKo: string | null | undefined,
  titleOriginal: string | null | undefined,
  language: string | null | undefined,
): boolean {
  const t = (titleKo ?? '').trim();
  if (!t) return true;
  if (isKoreanLanguage(language)) return false;
  if (!hasHangul(t)) return true;
  return t === (titleOriginal ?? '').trim();
}

/**
 * Body needs translation: only when the original has > 30 characters, and the
 * Korean body is NULL / blank or (non-Korean source) contains no Hangul.
 */
export function isUntranslatedContent(
  contentKo: string | null | undefined,
  contentOriginal: string | null | undefined,
  language: string | null | undefined,
): boolean {
  if (Array.from(contentOriginal ?? '').length <= 30) return false;
  const c = (contentKo ?? '').trim();
  if (!c) return true;
  return !isKoreanLanguage(language) && !hasHangul(c);
}

/** Summary is missing for a non-Korean article when it has no Hangul. */
export function isMissingSummary(
  summaryKo: string | null | undefined,
  language: string | null | undefined,
): boolean {
  return !isKoreanLanguage(language) && !hasHangul(summaryKo);
}

/** Paragraphs = non-blank lines (same rule as the S4 article view). */
export function countParagraphs(s: string | null | undefined): number {
  if (!s) return 0;
  return s.split('\n').filter((l) => l.trim() !== '').length;
}

/** Threshold of the old translator's hard cut (D18/D21). */
export const LEGACY_TRUNCATION_CHARS = 6000;

/** Paragraphs in the part of the original the old translator actually sent (first 6000 chars). */
export function legacyPrefixParagraphs(contentOriginal: string | null | undefined): number {
  return countParagraphs(Array.from(contentOriginal ?? '').slice(0, LEGACY_TRUNCATION_CHARS).join(''));
}

/**
 * A stored Korean body that bears the mark of the old 6000-char cut: the
 * original is longer than 6000 chars and the translation has no more
 * paragraphs than the first 6000 chars of the original (and fewer than the
 * whole original). A complete translation in which the model merged a few
 * paragraphs (e.g. 58 of 61) is NOT flagged; a repaired row has the full
 * paragraph count → false, so a re-run never re-translates it.
 */
export function isTruncatedTranslation(
  contentKo: string | null | undefined,
  contentOriginal: string | null | undefined,
): boolean {
  if (!contentKo || !hasHangul(contentKo)) return false;
  if (Array.from(contentOriginal ?? '').length <= LEGACY_TRUNCATION_CHARS) return false;
  const ko = countParagraphs(contentKo);
  return ko < countParagraphs(contentOriginal) && ko <= legacyPrefixParagraphs(contentOriginal);
}

/**
 * The stored translation covers at least everything the old translator sent
 * (the first 6000 chars). Such a row is incomplete only at the tail, so a
 * failed repair keeps it instead of wiping it.
 */
export function coversLegacyPrefix(
  contentKo: string | null | undefined,
  contentOriginal: string | null | undefined,
): boolean {
  if (!contentKo || !hasHangul(contentKo)) return false;
  return countParagraphs(contentKo) >= legacyPrefixParagraphs(contentOriginal);
}

// ---------------------------------------------------------------------------
// Chunking for long bodies
// ---------------------------------------------------------------------------

export interface TranslationChunk {
  text: string;
  /**
   * How this chunk attaches to the previous one in the assembled output:
   * '\n' starts a new paragraph, ' ' continues the previous paragraph
   * (a fragment of a paragraph that was longer than maxChars).
   */
  joinWith: '\n' | ' ';
  /** True for fragments of an over-long paragraph (output is one paragraph). */
  fragment: boolean;
}

const SENTENCE_END = /[.!?。！？]/;
const CJK_SENTENCE_END = /[。！？]/;

/** Split one paragraph into raw sentence slices (whitespace kept, so concat === input). */
function splitSentences(p: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (!SENTENCE_END.test(c)) continue;
    // swallow runs like "?!" or "..."
    let j = i + 1;
    while (j < p.length && SENTENCE_END.test(p[j])) j++;
    const next = p[j];
    if (j >= p.length || /\s/.test(next) || CJK_SENTENCE_END.test(p[j - 1])) {
      while (j < p.length && /\s/.test(p[j])) j++;
      out.push(p.slice(start, j));
      start = j;
    }
    i = j - 1;
  }
  if (start < p.length) out.push(p.slice(start));
  return out;
}

/**
 * Hard-split a single sentence longer than maxChars: at the last space before
 * the limit, else a hard cut. Raw slices (concatenation === input), each
 * ≤ maxChars once trimmed.
 */
function hardSplit(s: string, maxChars: number): string[] {
  const out: string[] = [];
  let rest = s;
  while (rest.trim().length > maxChars) {
    const lead = rest.length - rest.trimStart().length;
    let cut = rest.lastIndexOf(' ', lead + maxChars);
    if (cut <= lead) {
      cut = lead + maxChars;
      // never split a surrogate pair
      const code = rest.charCodeAt(cut - 1);
      if (code >= 0xd800 && code <= 0xdbff) cut--;
      out.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    } else {
      out.push(rest.slice(0, cut + 1)); // keep the space so concatenation is lossless
      rest = rest.slice(cut + 1);
    }
  }
  if (rest) out.push(rest);
  return out;
}

function splitLongParagraph(p: string, maxChars: number): string[] {
  const pieces: string[] = [];
  for (const sentence of splitSentences(p)) {
    if (sentence.trim().length > maxChars) pieces.push(...hardSplit(sentence, maxChars));
    else pieces.push(sentence);
  }
  const groups: string[] = [];
  let cur = '';
  for (const piece of pieces) {
    const candidate = cur + piece;
    if (cur.trim() && candidate.trim().length > maxChars) {
      groups.push(cur.trim());
      cur = piece;
    } else {
      cur = candidate;
    }
  }
  if (cur.trim()) groups.push(cur.trim());
  return groups;
}

/**
 * Splits a body into chunks of at most `maxChars` characters:
 *  (a) whole paragraphs are packed together (joined by '\n' inside a chunk);
 *  (b) a paragraph longer than maxChars is split alone at sentence boundaries
 *      (. ! ? 。 ！ ？), a sentence longer than maxChars at the last space before
 *      the limit, else hard-cut. Its fragments are re-joined with ' ' so the
 *      paragraph stays one paragraph;
 *  (c) no empty chunks; non-whitespace characters keep their order.
 */
export function splitForTranslation(text: string, maxChars = 3000): TranslationChunk[] {
  const limit = Math.max(1, Math.floor(maxChars));
  const paragraphs = (text ?? '')
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p !== '');

  const chunks: TranslationChunk[] = [];
  let current: string[] = [];
  let currentLen = 0;

  const flush = () => {
    if (current.length > 0) {
      chunks.push({ text: current.join('\n'), joinWith: '\n', fragment: false });
      current = [];
      currentLen = 0;
    }
  };

  for (const p of paragraphs) {
    if (p.length > limit) {
      flush();
      splitLongParagraph(p, limit).forEach((piece, i) => {
        chunks.push({ text: piece, joinWith: i === 0 ? '\n' : ' ', fragment: true });
      });
      continue;
    }
    const nextLen = currentLen === 0 ? p.length : currentLen + 1 + p.length;
    if (nextLen > limit) {
      flush();
      current = [p];
      currentLen = p.length;
    } else {
      current.push(p);
      currentLen = nextLen;
    }
  }
  flush();
  return chunks;
}

/** Model output → paragraphs joined by a single '\n' (blank lines removed). */
export function normalizeParagraphs(s: string): string {
  return s
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '')
    .join('\n');
}

// ---------------------------------------------------------------------------
// Tolerant JSON salvage for the title batch response
// ---------------------------------------------------------------------------

export interface SalvagedTitleItem {
  idx?: number;
  titleKo?: string;
  summaryKo?: string;
  primary?: string;
  secondary?: string;
}

function pickItem(rec: Record<string, unknown>): SalvagedTitleItem {
  const item: SalvagedTitleItem = {};
  if (typeof rec.idx === 'number' && Number.isInteger(rec.idx)) item.idx = rec.idx;
  else if (typeof rec.idx === 'string' && /^\d+$/.test(rec.idx.trim())) item.idx = Number(rec.idx.trim());
  for (const k of ['titleKo', 'summaryKo', 'primary', 'secondary'] as const) {
    if (typeof rec[k] === 'string') item[k] = rec[k] as string;
  }
  return item;
}

/** Parses a JSON string literal starting at s[i] === '"'. null when it is not closed. */
function readJsonString(s: string, i: number): { value: string; end: number } | null {
  let out = '';
  let j = i + 1;
  while (j < s.length) {
    const c = s[j];
    if (c === '"') return { value: out, end: j + 1 };
    if (c === '\\') {
      if (j + 1 >= s.length) return null;
      const e = s[j + 1];
      if (e === 'u') {
        const hex = s.slice(j + 2, j + 6);
        if (hex.length < 4) return null;
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) return null;
        out += String.fromCharCode(parseInt(hex, 16));
        j += 6;
        continue;
      }
      const map: Record<string, string> = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
      out += map[e] ?? e;
      j += 2;
      continue;
    }
    out += c;
    j++;
  }
  return null;
}

/** Object-by-object scan that keeps every field whose value was fully received. */
function scanObjects(s: string): SalvagedTitleItem[] {
  const items: SalvagedTitleItem[] = [];
  let i = 0;
  const skipWs = (k: number) => {
    while (k < s.length && /\s/.test(s[k])) k++;
    return k;
  };

  while (i < s.length) {
    const open = s.indexOf('{', i);
    if (open === -1) break;
    const rec: Record<string, unknown> = {};
    let j = open + 1;
    for (;;) {
      j = skipWs(j);
      while (j < s.length && s[j] === ',') j = skipWs(j + 1);
      if (j >= s.length) break; // truncated inside the object
      if (s[j] === '}') {
        j++;
        break;
      }
      if (s[j] !== '"') break; // malformed — resync at the next '{'
      const key = readJsonString(s, j);
      if (!key) break;
      j = skipWs(key.end);
      if (s[j] !== ':') break;
      j = skipWs(j + 1);
      if (s[j] === '"') {
        const val = readJsonString(s, j);
        if (!val) break; // unterminated value (e.g. a cut summaryKo) is dropped
        rec[key.value] = val.value;
        j = val.end;
        continue;
      }
      const lit = /^(?:-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/.exec(s.slice(j, j + 40));
      if (!lit) break; // nested value — not part of the contract
      const after = j + lit[0].length;
      if (after >= s.length) break; // "idx":1 at the very end could be "idx":12 cut short
      rec[key.value] = JSON.parse(lit[0]);
      j = after;
    }
    const item = pickItem(rec);
    if (Object.keys(item).length > 0) items.push(item);
    i = Math.max(j, open + 1);
  }
  return items;
}

/**
 * Title-batch response → items. Never throws.
 *  1. strip ``` fences, try the complete JSON array;
 *  2. otherwise salvage object by object: every closed string field is kept,
 *     a cut-off last object still counts when its idx and titleKo are closed,
 *     an unterminated summaryKo is dropped.
 */
export function salvageTitleItems(raw: unknown): SalvagedTitleItem[] {
  if (typeof raw !== 'string') return [];
  const text = raw.replace(/```(?:json)?/gi, '').trim();
  if (!text) return [];

  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end > start) {
    try {
      const parsed: unknown = JSON.parse(text.slice(start, end + 1));
      if (Array.isArray(parsed)) {
        return parsed
          .filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x))
          .map(pickItem);
      }
    } catch {
      /* fall through to the tolerant scan */
    }
  }
  try {
    return scanObjects(start === -1 ? text : text.slice(start));
  } catch {
    return [];
  }
}
