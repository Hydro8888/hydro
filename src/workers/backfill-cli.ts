/**
 * backfill-cli.ts
 * Standalone bulk translation healer — walks the WHOLE untranslated backlog
 * once (id cursor, newest first), instead of the one-batch-per-4h trickle the
 * collector does. A row that fails is not retried in the same run.
 *
 * Usage:
 *   npm run backfill:translations                                   # titles + summaries (cheap)
 *   npm run backfill:translations -- --content                      # + untranslated bodies (costly)
 *   npm run backfill:translations -- --content --repair-truncated   # + one-off repair of bodies cut at 6000 chars
 *   npm run backfill:translations -- --round-size=150 --content-per-round=20 --max-rounds=200
 *
 * Exit codes: 0 done · 1 config/fatal error · 2 the translation API itself is
 * failing (a whole round of requests failed at the HTTP level) · 3 the API
 * account is out of credits / over its spending limit. Rows the model
 * merely refuses (echo, unusable output) are reported, not treated as an outage.
 */

import { PrismaClient } from '@prisma/client';
import { backfillTranslations, type BackfillCursor } from './backfill';
import { countTranslationBacklog } from '../lib/translation-coverage';
import { describeXaiEndpoint } from '../lib/xai-client';
import { parseIntParam } from '../lib/utils';

interface CliOptions {
  content: boolean;
  repairTruncated: boolean;
  roundSize: number;
  contentPerRound: number;
  maxRounds: number;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    content: false,
    repairTruncated: false,
    roundSize: 150,       // titles per round (15 API calls of 10)
    contentPerRound: 20,  // bodies per round
    maxRounds: 200,
  };
  for (const arg of argv) {
    const eq = arg.indexOf('=');
    const key = eq === -1 ? arg : arg.slice(0, eq);
    const value = eq === -1 ? undefined : arg.slice(eq + 1);
    switch (key) {
      case '--content':
        opts.content = true;
        break;
      case '--repair-truncated':
        opts.repairTruncated = true;
        break;
      case '--round-size':
        opts.roundSize = parseIntParam(value, { min: 10, max: 1000, fallback: 150 });
        break;
      case '--content-per-round':
        opts.contentPerRound = parseIntParam(value, { min: 1, max: 200, fallback: 20 });
        break;
      case '--max-rounds':
        opts.maxRounds = parseIntParam(value, { min: 1, max: 10000, fallback: 200 });
        break;
      default:
        console.warn(`[backfill-cli] Unknown argument ignored: ${arg}`);
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const prisma = new PrismaClient();
  const model = process.env.XAI_MODEL || 'grok-4-1-fast';
  const endpoint = describeXaiEndpoint();

  if (!process.env.XAI_API_KEY?.trim()) {
    console.error('[backfill-cli] ✗ XAI_API_KEY is not set. Translation cannot run.');
    console.error('               Set XAI_API_KEY in .env and retry.');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log('[backfill-cli] ── Translation backfill started ──');
  console.log(
    `[backfill-cli] endpoint=${endpoint} model=${model} content=${opts.content} ` +
      `repairTruncated=${opts.repairTruncated} roundSize=${opts.roundSize}`,
  );

  const totals = {
    titlesFixed: 0,
    titlesFailed: 0,
    contentFixed: 0,
    contentFailed: 0,
    repaired: 0,
    repairReset: 0,
    repairKept: 0,
  };
  let remaining = { titles: 0, bodies: 0, summaries: 0, truncated: 0 };

  try {
    const before = await countTranslationBacklog(prisma);
    remaining = {
      titles: before.untranslatedTitles,
      bodies: before.untranslatedBodies,
      summaries: before.missingSummaries,
      truncated: before.truncatedBodies,
    };
    console.log(`[backfill-cli] Untranslated titles at start: ${before.untranslatedTitles}`);
    console.log(`[backfill-cli] Missing Korean summaries at start: ${before.missingSummaries}`);
    console.log(`[backfill-cli] Untranslated bodies at start: ${before.untranslatedBodies}`);
    if (opts.repairTruncated) {
      console.log(`[backfill-cli] Truncated bodies to repair: ${before.truncatedBodies}`);
    } else {
      console.log(`[backfill-cli] Truncated bodies (repair with --repair-truncated): ${before.truncatedBodies}`);
    }

    // undefined = start at the newest row, null = phase disabled / exhausted
    let cursor: Partial<BackfillCursor> = {
      titleBeforeId: before.untranslatedTitles + before.missingSummaries > 0 ? undefined : null,
      contentBeforeId: opts.content && before.untranslatedBodies > 0 ? undefined : null,
      repairBeforeId: opts.repairTruncated && before.truncatedBodies > 0 ? undefined : null,
    };

    let round = 0;
    while (
      round < opts.maxRounds &&
      (cursor.titleBeforeId !== null || cursor.contentBeforeId !== null || cursor.repairBeforeId !== null)
    ) {
      round++;
      const stats = await backfillTranslations(prisma, {
        titleLimit: cursor.titleBeforeId === null ? 0 : opts.roundSize,
        contentLimit: cursor.contentBeforeId === null ? 0 : opts.contentPerRound,
        repairLimit: cursor.repairBeforeId === null ? 0 : opts.contentPerRound,
        cursor,
      });
      totals.titlesFixed += stats.titlesFixed;
      totals.titlesFailed += stats.titlesFailed;
      totals.contentFixed += stats.contentFixed;
      totals.contentFailed += stats.contentFailed;
      totals.repaired += stats.repaired;
      totals.repairReset += stats.repairReset;
      totals.repairKept += stats.repairKept;
      remaining = {
        titles: stats.remainingTitles,
        bodies: stats.remainingContent,
        summaries: stats.remainingSummaries,
        truncated: stats.remainingTruncated,
      };

      console.log(
        `[backfill-cli] Round ${round}: titles +${stats.titlesFixed}/-${stats.titlesFailed}, ` +
          `bodies +${stats.contentFixed}/-${stats.contentFailed}, repaired ${stats.repaired}/reset ${stats.repairReset}/kept ${stats.repairKept}, ` +
          `api ${stats.apiCalls - stats.apiFailures}/${stats.apiCalls} ok`,
      );

      // Outage detection: every request of the round failed at the HTTP level.
      // (A round where the model only refused some rows is NOT an outage.)
      if (stats.apiCalls > 0 && stats.apiFailures === stats.apiCalls) {
        console.error(`[backfill-cli] ✗ All ${stats.apiCalls} translation request(s) in this round failed.`);
        if (stats.apiLastError) console.error(`               Last API error: ${stats.apiLastError}`);
        if (stats.billingBlocked) {
          console.error('               ➜ The xAI account is out of credits or over its monthly spending limit.');
          console.error('                 Add credits / raise the limit in the xAI console, then rerun this command.');
          console.error('                 (Nothing was changed in the database.)');
          process.exitCode = 3;
          break;
        }
        console.error('               The translation API is not reachable or rejects requests. Check:');
        console.error('               1) XAI_API_KEY is valid and has quota');
        console.error(`               2) XAI_MODEL ("${model}") is a real model id`);
        console.error(`               3) Network egress to ${endpoint} is allowed (XAI_BASE_URL)`);
        process.exitCode = 2;
        break;
      }

      cursor = stats.nextCursor ?? { titleBeforeId: null, contentBeforeId: null, repairBeforeId: null };
      if (stats.nextCursor) await new Promise((r) => setTimeout(r, 500));
    }

    if (round >= opts.maxRounds) {
      console.warn(`[backfill-cli] Reached max rounds (${opts.maxRounds}) — run again to continue.`);
    }

    // Clear cached pages so healed titles show immediately (S4 contract A)
    try {
      const { redis } = await import('../lib/redis');
      if (redis) {
        const keys = await redis.keys('*');
        if (keys.length > 0) await redis.del(...keys);
        console.log(`[backfill-cli] Cleared ${keys.length} cache key(s).`);
        await redis.quit();
      }
    } catch (err) {
      console.warn('[backfill-cli] Cache clear skipped:', err instanceof Error ? err.message : err);
    }

    console.log(
      `[backfill-cli] Done: titles healed=${totals.titlesFixed} failed=${totals.titlesFailed}; ` +
        `bodies healed=${totals.contentFixed} failed=${totals.contentFailed}; ` +
        `repaired=${totals.repaired} reset=${totals.repairReset} kept=${totals.repairKept}; ` +
        `remaining titles=${remaining.titles} bodies=${remaining.bodies} ` +
        `summaries=${remaining.summaries} truncated=${remaining.truncated}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[backfill-cli] Fatal error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
