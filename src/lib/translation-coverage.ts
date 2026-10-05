/**
 * translation-coverage.ts
 * THE definition of "untranslated" in SQL — shared by the backfill worker,
 * the backfill CLI, /api/admin/fix-translations and /api/admin/health so the
 * numbers always agree. The pure mirror lives in src/workers/translation-text.ts
 * (isUntranslatedTitle / isUntranslatedContent / isTruncatedTranslation).
 *
 * Imports only @prisma/client (workers load this with a relative path; no `@/` alias).
 */

import { Prisma, type PrismaClient } from '@prisma/client';

/** Same normalization as normalizeLanguageTag(): lower, '_' → '-', first subtag. */
const NON_KO = Prisma.sql`split_part(replace(lower(btrim(coalesce("language", ''))), '_', '-'), '-', 1) NOT IN ('ko', 'korean')`;

/** No non-whitespace character (NULL-safe via the IS NULL branches below). */
const blank = (col: Prisma.Sql) => Prisma.sql`${col} !~ '[^[:space:]]'`;
const trimmed = (col: Prisma.Sql) => Prisma.sql`regexp_replace(${col}, '^[[:space:]]+|[[:space:]]+$', '', 'g')`;
/** Non-blank lines — countParagraphs() in SQL. */
const paragraphs = (col: Prisma.Sql) =>
  Prisma.sql`(SELECT count(*) FROM regexp_split_to_table(coalesce(${col}, ''), chr(10)) AS line WHERE line ~ '[^[:space:]]')`;

const TITLE_KO = Prisma.sql`"titleKo"`;
const CONTENT_KO = Prisma.sql`"contentKo"`;
const CONTENT_ORIGINAL = Prisma.sql`"contentOriginal"`;

/** Untranslated title: NULL/blank, or (non-ko) no Hangul / identical to the original. */
export const UNTRANSLATED_TITLE_SQL = Prisma.sql`(
  "titleKo" IS NULL OR ${blank(TITLE_KO)}
  OR (${NON_KO} AND ("titleKo" !~ '[가-힣]' OR ${trimmed(TITLE_KO)} = ${trimmed(Prisma.sql`"titleOriginal"`)}))
)`;

/** Untranslated body: original > 30 chars and contentKo NULL/blank or (non-ko) no Hangul. */
export const UNTRANSLATED_BODY_SQL = Prisma.sql`(
  char_length(coalesce("contentOriginal", '')) > 30
  AND ("contentKo" IS NULL OR ${blank(CONTENT_KO)} OR (${NON_KO} AND "contentKo" !~ '[가-힣]'))
)`;

/** Missing summary: non-ko article whose summaryKo has no Hangul (NULL/blank/English). */
export const MISSING_SUMMARY_SQL = Prisma.sql`(
  ${NON_KO} AND ("summaryKo" IS NULL OR "summaryKo" !~ '[가-힣]')
)`;

/**
 * Body translation cut by the old 6000-char limit: no more paragraphs than the
 * first 6000 chars of the original (and fewer than the whole original).
 * A complete translation with a few merged paragraphs is not flagged.
 */
export const TRUNCATED_BODY_SQL = Prisma.sql`(
  ${NON_KO}
  AND char_length(coalesce("contentOriginal", '')) > 6000
  AND "contentKo" ~ '[가-힣]'
  AND ${paragraphs(CONTENT_KO)} < ${paragraphs(CONTENT_ORIGINAL)}
  AND ${paragraphs(CONTENT_KO)} <= ${paragraphs(Prisma.sql`left("contentOriginal", 6000)`)}
)`;

export type BacklogKind = 'title' | 'body' | 'summary' | 'truncated' | 'titleOrSummary';

function predicate(kind: BacklogKind): Prisma.Sql {
  switch (kind) {
    case 'title':
      return UNTRANSLATED_TITLE_SQL;
    case 'body':
      return UNTRANSLATED_BODY_SQL;
    case 'summary':
      return MISSING_SUMMARY_SQL;
    case 'truncated':
      return TRUNCATED_BODY_SQL;
    case 'titleOrSummary':
      return Prisma.sql`(${UNTRANSLATED_TITLE_SQL} OR ${MISSING_SUMMARY_SQL})`;
  }
}

/**
 * Active article ids matching `kind`, newest id first, strictly below `beforeId`
 * when given (cursor — one pass over the backlog never revisits a row).
 */
export async function selectBacklogIds(
  prisma: PrismaClient,
  kind: BacklogKind,
  opts: { beforeId?: number | null; take: number },
): Promise<number[]> {
  const take = Math.max(0, Math.floor(opts.take));
  if (take === 0) return [];
  const cursor =
    typeof opts.beforeId === 'number' && Number.isFinite(opts.beforeId)
      ? Prisma.sql`AND id < ${Math.floor(opts.beforeId)}`
      : Prisma.empty;
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM "Article"
    WHERE "isActive" AND ${predicate(kind)} ${cursor}
    ORDER BY id DESC
    LIMIT ${take}`;
  return rows.map((r) => Number(r.id));
}

export interface TranslationBacklog {
  untranslatedTitles: number;
  untranslatedBodies: number;
  missingSummaries: number;
  truncatedBodies: number;
  /** Active non-Korean articles (denominator for the numbers above). */
  activeForeign: number;
}

export async function countTranslationBacklog(prisma: PrismaClient): Promise<TranslationBacklog> {
  const rows = await prisma.$queryRaw<Array<Record<keyof TranslationBacklog, bigint | number>>>`
    SELECT
      count(*) FILTER (WHERE ${UNTRANSLATED_TITLE_SQL}) AS "untranslatedTitles",
      count(*) FILTER (WHERE ${UNTRANSLATED_BODY_SQL})  AS "untranslatedBodies",
      count(*) FILTER (WHERE ${MISSING_SUMMARY_SQL})    AS "missingSummaries",
      count(*) FILTER (WHERE ${TRUNCATED_BODY_SQL})     AS "truncatedBodies",
      count(*) FILTER (WHERE ${NON_KO})                 AS "activeForeign"
    FROM "Article"
    WHERE "isActive"`;
  const r = rows[0];
  return {
    untranslatedTitles: Number(r?.untranslatedTitles ?? 0),
    untranslatedBodies: Number(r?.untranslatedBodies ?? 0),
    missingSummaries: Number(r?.missingSummaries ?? 0),
    truncatedBodies: Number(r?.truncatedBodies ?? 0),
    activeForeign: Number(r?.activeForeign ?? 0),
  };
}
