// How an article's (possibly partial) translation is presented (slice S4).
// Pure — no React / Prisma / next imports — unit-tested in tests/article-view.test.ts.
import { getDisplayTitle, toLangTag } from './utils';

export type BodyMode = 'translated' | 'summary+original' | 'original' | 'summary' | 'empty';

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  ja: '日本語',
  zh: '中文',
  ko: '한국어',
};

/** Human label for the source language: en → English, ja → 日本語, zh → 中文, ko → 한국어, else '원문'. */
export function languageLabel(lang: string | null | undefined): string {
  const tag = toLangTag(lang);
  const primary = tag ? tag.split('-')[0] : '';
  return Object.prototype.hasOwnProperty.call(LANGUAGE_LABELS, primary) ? LANGUAGE_LABELS[primary] : '원문';
}

/** Splits stored text into paragraphs: '\n'-separated, trimmed, blank lines dropped. */
export function splitParagraphs(text: string | null | undefined): string[] {
  if (typeof text !== 'string') return [];
  return text
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p !== '');
}

const nonBlank = (v: string | null | undefined): string | null =>
  typeof v === 'string' && v.trim() !== '' ? v.trim() : null;

export interface ArticleViewInput {
  titleKo?: string | null;
  titleOriginal: string;
  language?: string | null;
  summaryKo?: string | null;
  contentKo?: string | null;
  contentOriginal?: string | null;
}

export interface ArticleView {
  title: { text: string; lang: string | undefined; isTranslated: boolean };
  /** Title shown in the source language (NULL / blank / echoed titleKo) for a non-Korean article. */
  titlePending: boolean;
  bodyMode: BodyMode;
  /** Body shown without a Korean translation for a non-Korean article. */
  bodyPending: boolean;
  /** Trimmed summaryKo, null when blank. */
  summary: string | null;
  /** contentKo paragraphs (translated mode). */
  bodyParagraphs: string[];
  /** contentOriginal paragraphs. */
  originalParagraphs: string[];
  originalLang: string | undefined;
  originalLabel: string;
}

export function getArticleView(a: ArticleViewInput): ArticleView {
  const title = getDisplayTitle(a);
  const originalLang = toLangTag(a.language);
  const isKorean = originalLang === 'ko' || (originalLang ?? '').startsWith('ko-');
  const summary = nonBlank(a.summaryKo);
  const contentKo = nonBlank(a.contentKo);
  const contentOriginal = nonBlank(a.contentOriginal);

  let bodyMode: BodyMode;
  if (contentKo) bodyMode = 'translated';
  else if (summary && contentOriginal) bodyMode = 'summary+original';
  else if (contentOriginal) bodyMode = 'original';
  else if (summary) bodyMode = 'summary';
  else bodyMode = 'empty';

  return {
    title,
    titlePending: !title.isTranslated && !isKorean,
    bodyMode,
    bodyPending: !isKorean && (bodyMode === 'summary+original' || bodyMode === 'original' || bodyMode === 'summary'),
    summary,
    bodyParagraphs: splitParagraphs(contentKo),
    originalParagraphs: splitParagraphs(contentOriginal),
    originalLang,
    originalLabel: languageLabel(a.language),
  };
}
