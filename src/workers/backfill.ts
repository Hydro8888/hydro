/**
 * backfill.ts
 * Heals articles whose AI translation failed at collection time.
 *
 * Until now a failed translation was saved as titleKo=null and never retried,
 * which is why some articles permanently showed English titles. This worker
 * re-translates them in batches:
 *   - Phase 1: titles + summaries + categories (cheap, 10 per API call)
 *   - Phase 2: body content (expensive — cost-controlled small batch per run)
 *
 * Used by: collector.collectAll() after every run, and the
 * /api/admin/fix-translations endpoint for on-demand bulk healing.
 */

import type { PrismaClient, Prisma } from '@prisma/client';
import { translateTitleBatch, type TranslatableArticle } from './translator';
import { translateContent } from './content-translator';

export interface BackfillStats {
  titlesScanned: number;
  titlesFixed: number;
  contentScanned: number;
  contentFixed: number;
  remainingTitles: number;
  remainingContent: number;
}

const MISSING_TITLE_WHERE: Prisma.ArticleWhereInput = {
  isActive: true,
  OR: [{ titleKo: null }, { titleKo: '' }],
};

const MISSING_CONTENT_WHERE: Prisma.ArticleWhereInput = {
  isActive: true,
  AND: [
    { OR: [{ contentKo: null }, { contentKo: '' }] },
    { contentOriginal: { not: null } },
  ],
};

export async function backfillTranslations(
  prisma: PrismaClient,
  opts: { titleLimit?: number; contentLimit?: number } = {},
): Promise<BackfillStats> {
  const titleLimit = opts.titleLimit ?? 200;
  const contentLimit = opts.contentLimit ?? 20;

  // ── Phase 1: titles + summaries + categories ──────────────────────────────
  const allRows = titleLimit > 0
    ? await prisma.article.findMany({
        where: MISSING_TITLE_WHERE,
        orderBy: { createdAt: 'desc' },
        take: titleLimit,
        select: { id: true, titleOriginal: true, summaryKo: true, categoryPrimary: true, language: true },
      })
    : [];

  // Korean-language articles need no API call — pass the title through
  const koRows = allRows.filter((r) => r.language === 'ko');
  const rows = allRows.filter((r) => r.language !== 'ko');

  let titlesFixed = 0;
  for (const r of koRows) {
    try {
      await prisma.article.update({ where: { id: r.id }, data: { titleKo: r.titleOriginal } });
      titlesFixed++;
    } catch (err) {
      console.warn(`[backfill] ko pass-through failed for ${r.id}:`, err instanceof Error ? err.message : err);
    }
  }
  if (koRows.length > 0) {
    console.log(`[backfill] Passed through ${koRows.length} Korean-language title(s) without API calls`);
  }

  if (rows.length > 0) {
    console.log(`[backfill] Re-translating ${rows.length} article title(s)…`);
    const results = await translateTitleBatch(rows.map((r) => r.titleOriginal));

    for (let i = 0; i < rows.length; i++) {
      const t = results[i];
      if (!t?.titleKo) continue; // chunk failed — picked up again next run

      const data: Record<string, unknown> = { titleKo: t.titleKo };
      if (t.summaryKo && !rows[i].summaryKo) data.summaryKo = t.summaryKo;
      if (
        t.primary && t.primary !== 'general' &&
        (!rows[i].categoryPrimary || rows[i].categoryPrimary === 'general')
      ) {
        data.categoryPrimary = t.primary;
      }

      try {
        await prisma.article.update({ where: { id: rows[i].id }, data });
        titlesFixed++;
      } catch (err) {
        console.warn(
          `[backfill] Update failed for article ${rows[i].id}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
    console.log(`[backfill] Titles healed: ${titlesFixed}/${allRows.length}`);
  }

  // ── Phase 2: body content (small batch — one API call per article) ───────
  let contentFixed = 0;
  let contentTargets: Array<{ id: number; titleOriginal: string; contentOriginal: string | null }> = [];

  if (contentLimit > 0) {
    const candidates = await prisma.article.findMany({
      where: MISSING_CONTENT_WHERE,
      orderBy: { createdAt: 'desc' },
      take: contentLimit * 2,
      select: { id: true, titleOriginal: true, contentOriginal: true },
    });
    contentTargets = candidates
      .filter((c) => (c.contentOriginal?.length ?? 0) > 30)
      .slice(0, contentLimit);

    if (contentTargets.length > 0) {
      console.log(`[backfill] Re-translating ${contentTargets.length} article bodies…`);
      // translateContent only reads titleOriginal/contentOriginal and writes contentKo
      const items = contentTargets.map(
        (c) =>
          ({
            titleOriginal: c.titleOriginal,
            contentOriginal: c.contentOriginal,
          }) as unknown as TranslatableArticle,
      );
      await translateContent(items);

      for (let i = 0; i < contentTargets.length; i++) {
        const contentKo = items[i].contentKo;
        if (!contentKo) continue;
        try {
          await prisma.article.update({
            where: { id: contentTargets[i].id },
            data: { contentKo },
          });
          contentFixed++;
        } catch (err) {
          console.warn(
            `[backfill] Content update failed for article ${contentTargets[i].id}:`,
            err instanceof Error ? err.message : err,
          );
        }
      }
      console.log(`[backfill] Bodies healed: ${contentFixed}/${contentTargets.length}`);
    }
  }

  // ── Remaining work counts (for progress reporting) ───────────────────────
  const [remainingTitles, remainingContent] = await Promise.all([
    prisma.article.count({ where: MISSING_TITLE_WHERE }),
    prisma.article.count({ where: MISSING_CONTENT_WHERE }),
  ]);

  return {
    titlesScanned: allRows.length,
    titlesFixed,
    contentScanned: contentTargets.length,
    contentFixed,
    remainingTitles,
    remainingContent,
  };
}
