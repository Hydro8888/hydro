/**
 * backfill-cli.ts
 * Standalone bulk translation healer — clears the ENTIRE untranslated backlog
 * in one run, instead of the 100-per-4h trickle the collector does.
 *
 * This is the "Harness Loop" for translations:
 *   RUN backfill → MEASURE remaining → REPEAT until 0 or no progress.
 *
 * Usage:
 *   npm run backfill:translations                 # titles only (fast/cheap)
 *   npm run backfill:translations -- --content    # titles + bodies (slow/costly)
 *   npm run backfill:translations -- --max-rounds=50 --round-size=200
 *
 * If it makes ZERO progress for two consecutive rounds it aborts and tells you
 * the likely cause (XAI_API_KEY missing / invalid, or wrong XAI_MODEL) — so a
 * silent translation outage can no longer masquerade as "just a big backlog".
 */

import { PrismaClient } from '@prisma/client';
import { backfillTranslations } from './backfill';

function parseArgs(argv: string[]) {
  const opts = {
    content: false,
    roundSize: 150,        // titles per round (15 API calls of 10)
    contentPerRound: 20,   // bodies per round (one API call each)
    maxRounds: 200,
  };
  for (const arg of argv) {
    if (arg === '--content') opts.content = true;
    else if (arg.startsWith('--round-size=')) opts.roundSize = Math.max(10, parseInt(arg.split('=')[1], 10) || 150);
    else if (arg.startsWith('--content-per-round=')) opts.contentPerRound = Math.max(1, parseInt(arg.split('=')[1], 10) || 20);
    else if (arg.startsWith('--max-rounds=')) opts.maxRounds = Math.max(1, parseInt(arg.split('=')[1], 10) || 200);
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const prisma = new PrismaClient();

  if (!process.env.XAI_API_KEY) {
    console.error('[backfill-cli] ✗ XAI_API_KEY is not set. Translation cannot run.');
    console.error('               Set XAI_API_KEY in .env and retry.');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log('[backfill-cli] ── Translation backfill started ──');
  console.log(`[backfill-cli] model=${process.env.XAI_MODEL || 'grok-4-1-fast'} content=${opts.content} roundSize=${opts.roundSize}`);

  let round = 0;
  let dryRounds = 0;
  let totalTitles = 0;
  let totalBodies = 0;

  try {
    // Initial snapshot
    const before = await prisma.article.count({
      where: { isActive: true, OR: [{ titleKo: null }, { titleKo: '' }] },
    });
    console.log(`[backfill-cli] Untranslated titles at start: ${before}`);
    if (before === 0 && !opts.content) {
      console.log('[backfill-cli] Nothing to do — all active articles already have Korean titles.');
      await prisma.$disconnect();
      return;
    }

    while (round < opts.maxRounds) {
      round++;
      const stats = await backfillTranslations(prisma, {
        titleLimit: opts.roundSize,
        contentLimit: opts.content ? opts.contentPerRound : 0,
      });
      totalTitles += stats.titlesFixed;
      totalBodies += stats.contentFixed;

      console.log(
        `[backfill-cli] Round ${round}: +${stats.titlesFixed} titles, +${stats.contentFixed} bodies ` +
        `(remaining: ${stats.remainingTitles} titles, ${stats.remainingContent} bodies)`,
      );

      const titlesDone = stats.remainingTitles === 0;
      const contentDone = !opts.content || stats.remainingContent === 0;
      if (titlesDone && contentDone) {
        console.log('[backfill-cli] ✓ Backlog cleared.');
        break;
      }

      // No-progress detection → likely an API/config outage, not a backlog
      if (stats.titlesFixed === 0 && stats.contentFixed === 0) {
        dryRounds++;
        if (dryRounds >= 2) {
          console.error('[backfill-cli] ✗ Two consecutive rounds healed 0 items.');
          console.error('               The translation API is likely failing. Check:');
          console.error('               1) XAI_API_KEY is valid and has quota');
          console.error(`               2) XAI_MODEL ("${process.env.XAI_MODEL || 'grok-4-1-fast'}") is a real model id`);
          console.error('               3) Network egress to https://api.x.ai is allowed');
          process.exitCode = 2;
          break;
        }
      } else {
        dryRounds = 0;
      }

      // Small breather between rounds
      await new Promise((r) => setTimeout(r, 500));
    }

    if (round >= opts.maxRounds) {
      console.warn(`[backfill-cli] Reached max rounds (${opts.maxRounds}) — run again to continue.`);
    }

    // Clear cached pages so healed titles show immediately
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

    console.log(`[backfill-cli] ── Done. Total healed: ${totalTitles} titles, ${totalBodies} bodies. ──`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[backfill-cli] Fatal error:', err);
  process.exit(1);
});
