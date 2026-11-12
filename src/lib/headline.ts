// Size rule for the home lead headline (slice S3). Pure; see tests/headline.test.ts.
// Korean wraps between words (word-break: keep-all), so the number of lines swings with the
// length of the title. The tier keeps a long title from filling a phone screen in 28px serif.

export type LeadHeadlineTier = 'short' | 'medium' | 'long';

// Hangul jamo, CJK radicals and punctuation, kana, compatibility jamo, CJK ideographs, Hangul syllables,
// compatibility ideographs, full-width forms.
const WIDE = /[ᄀ-ᇿ⺀-〿぀-ヿ㄰-㆏㐀-鿿가-힯豈-﫿＀-￯]/;

/** Approximate set width in em: Hangul / CJK / full-width 1, whitespace 0.3, Latin, digits and punctuation 0.55. */
export function headlineUnits(text: string | null | undefined): number {
  let units = 0;
  for (const ch of Array.from(String(text ?? '').trim())) units += /\s/.test(ch) ? 0.3 : WIDE.test(ch) ? 1 : 0.55;
  return Math.round(units * 100) / 100;
}

export function leadHeadlineTier(text: string | null | undefined): LeadHeadlineTier {
  const units = headlineUnits(text);
  return units <= 30 ? 'short' : units <= 50 ? 'medium' : 'long';
}

/**
 * Size per tier, 600 at every size (the lead is the one headline set in 600).
 * Below 640px: 28px for a short title, 20px otherwise. From 640px: the fluid 32→40px, or 28px for a long title.
 * headline-md and headline-lg carry weight 500 in their token, hence the explicit weight next to them.
 * Complete class names only: Tailwind scans this file.
 */
export const LEAD_HEADLINE_CLASS: Record<LeadHeadlineTier, string> = {
  short: 'text-headline-xl',
  medium: 'text-headline-md font-semibold sm:text-headline-xl',
  long: 'text-headline-md font-semibold sm:text-headline-lg sm:font-semibold',
};
