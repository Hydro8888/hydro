/**
 * backfill.ts
 * Heals articles whose AI translation is missing or unusable.
 *
 * Targets come from ONE definition (src/lib/translation-coverage.ts):
 *   - Phase 1: untranslated titles (NULL / blank / English echo) ∪ missing
 *              Korean summaries — 10 titles per API call (cheap)
 *   - Phase 2: untranslated bodies — chunked full-body translation (costly,
 *              small batch per run)
 *   - Phase 3: (opt-in, operator only) bodies cut by the old 6000-char limit
 *
 * Rules (S4 contract A — the pages trust what is stored):
 *   - only complete Korean text is written; an already-good titleKo is never overwritten
 *   - an echo titleKo / Hangul-less contentKo that the model refuses again is reset to NULL
 *   - each phase walks the backlog with an id cursor (newest first), so one
 *     run never re-selects a row that just failed
 *
 * Used by: collector.collectAll() after every run (one batch, no repair), the
 * /api/admin/fix-translations endpoint, and backfill-cli.ts (cursor loop).
 */

import type { PrismaClient } from '@prisma/client';
import { translateTitleBatch } from './translator';
import { translateLongText } from './content-translator';
import {
  hasHangul,
  isKoreanLanguage,
  coversLegacyPrefix,
  isMostlyKorean,
  isStandardCategory,
  isTruncatedTranslation,
  isUntranslatedContent,
  isUntranslatedTitle,
} from './translation-text';
import { countTranslationBacklog, selectBacklogIds } from '../lib/translation-coverage';
import { createXaiClient, newApiStats, type ChatClient } from '../lib/xai-client';

export interface BackfillCursor {
  /** next title/summary page starts below this id; null = phase exhausted */
  titleBeforeId: number | null;
  contentBeforeId: number | null;
  repairBeforeId: number | null;
}

export interface BackfillStats {
  titlesScanned: number;
  /** rows whose title and/or summary was healed */
  titlesFixed: number;
  /** rows still untranslated / summary-less after this attempt */
  titlesFailed: number;
  /** echo titles reset to NULL because the model refused them again */
  titlesCleared: number;
  contentScanned: number;
  contentFixed: number;
  contentFailed: number;
  /** truncated bodies re-translated completely */
  repaired: number;
  /** truncated bodies reset to NULL (could not be re-translated completely) */
  repairReset: number;
  /** failed repairs whose stored translation covers the first 6000 chars — kept */
  repairKept: number;
  apiCalls: number;
  apiFailures: number;
  remainingTitles: number;
  remainingContent: number;
  remainingSummaries: number;
  remainingTruncated: number;
  /** null when every enabled phase has walked to the end of its backlog */
  nextCursor: BackfillCursor | null;
}

export interface BackfillOptions {
  titleLimit?: number;
  contentLimit?: number;
  /** > 0 enables the truncated-body repair phase (operator CLI only). */
  repairLimit?: number;
  /**
   * Continue a previous pass. A field that is undefined starts from the newest
   * row; null means that phase is already exhausted and is skipped.
   */
  cursor?: Partial<BackfillCursor>;
  /** Pause between bodies (default 500ms). */
  articlePauseMs?: number;
  /** Inject a chat client (tests). Default: createXaiClient('text'). */
  client?: ChatClient | null;
}

const sleep = (ms: number) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

/** Cursor for the next page: null when this page was the last one. */
function nextBeforeId(ids: number[], take: number): number | null {
  if (ids.length < take || ids.length === 0) return null;
  return Math.min(...ids);
}

function warnUpdate(id: number, err: unknown) {
  console.warn(`[backfill] Update failed for article ${id}:`, err instanceof Error ? err.message : err);
}

export async function backfillTranslations(
  prisma: PrismaClient,
  opts: BackfillOptions = {},
): Promise<BackfillStats> {
  const titleLimit = Math.max(0, opts.titleLimit ?? 200);
  const contentLimit = Math.max(0, opts.contentLimit ?? 20);
  const repairLimit = Math.max(0, opts.repairLimit ?? 0);
  const cursor = opts.cursor ?? {};
  const articlePauseMs = opts.articlePauseMs ?? 500;
  const api = newApiStats();
  const next: BackfillCursor = { titleBeforeId: null, contentBeforeId: null, repairBeforeId: null };

  // ── Phase 1: titles + summaries + categories ──────────────────────────────
  let titlesScanned = 0;
  let titlesFixed = 0;
  let titlesFailed = 0;
  let titlesCleared = 0;

  if (titleLimit > 0 && cursor.titleBeforeId !== null) {
    const ids = await selectBacklogIds(prisma, 'titleOrSummary', {
      beforeId: cursor.titleBeforeId,
      take: titleLimit,
    });
    next.titleBeforeId = nextBeforeId(ids, titleLimit);
    const rows = ids.length
      ? await prisma.article.findMany({
          where: { id: { in: ids } },
          orderBy: { id: 'desc' },
          select: {
            id: true,
            titleOriginal: true,
            titleKo: true,
            summaryKo: true,
            categoryPrimary: true,
            language: true,
          },
        })
      : [];
    titlesScanned = rows.length;

    // Korean-language articles need no API call — pass the title through
    const koRows = rows.filter((r) => isKoreanLanguage(r.language));
    const foreign = rows.filter((r) => !isKoreanLanguage(r.language));

    for (const r of koRows) {
      if (!isUntranslatedTitle(r.titleKo, r.titleOriginal, r.language)) continue;
      try {
        await prisma.article.update({ where: { id: r.id }, data: { titleKo: r.titleOriginal } });
        titlesFixed++;
      } catch (err) {
        warnUpdate(r.id, err);
      }
    }
    if (koRows.length > 0) {
      console.log(`[backfill] Passed through ${koRows.length} Korean-language title(s) without API calls`);
    }

    if (foreign.length > 0) {
      console.log(`[backfill] Re-translating ${foreign.length} article title(s)/summaries…`);
      const results = await translateTitleBatch(
        foreign.map((r) => r.titleOriginal),
        { stats: api, ...(opts.client !== undefined ? { client: opts.client } : {}) },
      );

      for (let i = 0; i < foreign.length; i++) {
        const r = foreign[i];
        const t = results[i];
        const titleWasUntranslated = isUntranslatedTitle(r.titleKo, r.titleOriginal, r.language);
        const summaryWasMissing = !hasHangul(r.summaryKo);
        const data: { titleKo?: string | null; summaryKo?: string; categoryPrimary?: string } = {};

        if (t?.titleKo) {
          if (titleWasUntranslated) data.titleKo = t.titleKo;
          if (summaryWasMissing && hasHangul(t.summaryKo)) data.summaryKo = t.summaryKo;
          const current = r.categoryPrimary;
          if (!current || !isStandardCategory(current)) {
            data.categoryPrimary = t.primary; // already normalized to a standard slug
          } else if (current === 'general' && t.primary !== 'general') {
            data.categoryPrimary = t.primary;
          }
        } else if (
          t?.failure === 'rejected' &&
          titleWasUntranslated &&
          r.titleKo !== null &&
          r.titleKo.trim() !== ''
        ) {
          // An English echo the model refuses to translate again: the honest
          // state is "no Korean title" (S4 shows the original with its lang).
          data.titleKo = null;
          titlesCleared++;
        }

        const healedTitle = typeof data.titleKo === 'string';
        const healedSummary = data.summaryKo !== undefined;
        if ((titleWasUntranslated && !healedTitle) || (summaryWasMissing && !healedSummary)) titlesFailed++;
        if (Object.keys(data).length === 0) continue;

        try {
          await prisma.article.update({ where: { id: r.id }, data });
          if (healedTitle || healedSummary) titlesFixed++;
        } catch (err) {
          warnUpdate(r.id, err);
        }
      }
      console.log(
        `[backfill] Titles/summaries healed: ${titlesFixed}/${rows.length}` +
          (titlesCleared ? ` (${titlesCleared} echo title(s) reset to NULL)` : ''),
      );
    }
  }

  // ── Phase 2 / 3 need a client ─────────────────────────────────────────────
  const wantsBodies = contentLimit > 0 && cursor.contentBeforeId !== null;
  const wantsRepair = repairLimit > 0 && cursor.repairBeforeId !== null;
  const client =
    wantsBodies || wantsRepair ? (opts.client === undefined ? createXaiClient('text') : opts.client) : null;
  if ((wantsBodies || wantsRepair) && !client) {
    console.warn('[backfill] XAI_API_KEY not set — skipping body translation');
  }

  // ── Phase 2: untranslated bodies ──────────────────────────────────────────
  let contentScanned = 0;
  let contentFixed = 0;
  let contentFailed = 0;

  if (wantsBodies && client) {
    const ids = await selectBacklogIds(prisma, 'body', {
      beforeId: cursor.contentBeforeId,
      take: contentLimit,
    });
    next.contentBeforeId = nextBeforeId(ids, contentLimit);
    const rows = ids.length
      ? await prisma.article.findMany({
          where: { id: { in: ids } },
          orderBy: { id: 'desc' },
          select: { id: true, titleOriginal: true, contentOriginal: true, contentKo: true, language: true },
        })
      : [];
    contentScanned = rows.length;
    if (rows.length > 0) console.log(`[backfill] Translating ${rows.length} article bodies…`);

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const original = r.contentOriginal ?? '';
      if (!isUntranslatedContent(r.contentKo, original, r.language)) continue;

      let contentKo: string | null = null;
      let reset = false;
      if (isMostlyKorean(original)) {
        contentKo = original; // already Korean — no API call
      } else {
        const res = await translateLongText(original, { client, language: r.language, stats: api });
        if (res.ok) {
          contentKo = res.text;
        } else {
          console.warn(`[backfill] Body ${r.id} not translated: ${res.reason}`);
          // A Hangul-less contentKo (echo) is dishonest — clear it unless the API was just down
          reset = !res.http && r.contentKo !== null;
        }
        if (i < rows.length - 1) await sleep(articlePauseMs);
      }

      if (contentKo === null) contentFailed++;
      if (contentKo === null && !reset) continue;
      try {
        await prisma.article.update({ where: { id: r.id }, data: { contentKo } });
        if (contentKo !== null) contentFixed++;
      } catch (err) {
        warnUpdate(r.id, err);
      }
    }
    if (rows.length > 0) console.log(`[backfill] Bodies healed: ${contentFixed}/${rows.length}`);
  }

  // ── Phase 3: repair bodies truncated by the old 6000-char cut (opt-in) ────
  let repaired = 0;
  let repairReset = 0;
  let repairKept = 0;

  if (wantsRepair && client) {
    const ids = await selectBacklogIds(prisma, 'truncated', {
      beforeId: cursor.repairBeforeId,
      take: repairLimit,
    });
    next.repairBeforeId = nextBeforeId(ids, repairLimit);
    const rows = ids.length
      ? await prisma.article.findMany({
          where: { id: { in: ids } },
          orderBy: { id: 'desc' },
          select: { id: true, contentOriginal: true, contentKo: true, language: true },
        })
      : [];
    if (rows.length > 0) console.log(`[backfill] Repairing ${rows.length} truncated body translation(s)…`);

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!isTruncatedTranslation(r.contentKo, r.contentOriginal)) continue;
      const res = await translateLongText(r.contentOriginal ?? '', { client, language: r.language, stats: api });
      if (!res.ok && res.http) {
        // API outage: keep the row as is, the next run picks it up again
        console.warn(`[backfill] Repair of ${r.id} skipped (API failure): ${res.reason}`);
      } else if (!res.ok && coversLegacyPrefix(r.contentKo, r.contentOriginal)) {
        // The stored text covers everything the old translator was given —
        // only the tail is missing. Keep it rather than lose a usable body.
        repairKept++;
        console.warn(`[backfill] Repair of ${r.id} failed (${res.reason}) — existing translation kept (covers the first 6000 chars)`);
      } else {
        try {
          if (res.ok) {
            await prisma.article.update({ where: { id: r.id }, data: { contentKo: res.text } });
            repaired++;
          } else {
            // Model could not produce a complete translation and the stored one
            // is cut short: drop it so the page shows summary + original honestly.
            await prisma.article.update({ where: { id: r.id }, data: { contentKo: null } });
            repairReset++;
            console.warn(`[backfill] Repair of ${r.id} failed (${res.reason}) — contentKo reset to NULL`);
          }
        } catch (err) {
          warnUpdate(r.id, err);
        }
      }
      if (i < rows.length - 1) await sleep(articlePauseMs);
    }
    if (rows.length > 0) console.log(`[backfill] Truncated bodies repaired: ${repaired}, reset: ${repairReset}, kept: ${repairKept}`);
  }

  // ── Remaining work counts (same definition as /api/admin/health) ─────────
  const backlog = await countTranslationBacklog(prisma);
  const exhausted =
    next.titleBeforeId === null && next.contentBeforeId === null && next.repairBeforeId === null;

  return {
    titlesScanned,
    titlesFixed,
    titlesFailed,
    titlesCleared,
    contentScanned,
    contentFixed,
    contentFailed,
    repaired,
    repairReset,
    repairKept,
    apiCalls: api.apiCalls,
    apiFailures: api.apiFailures,
    remainingTitles: backlog.untranslatedTitles,
    remainingContent: backlog.untranslatedBodies,
    remainingSummaries: backlog.missingSummaries,
    remainingTruncated: backlog.truncatedBodies,
    nextCursor: exhausted ? null : next,
  };
}
