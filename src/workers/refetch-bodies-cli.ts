/**
 * refetch-bodies-cli.ts
 * Fetch the FULL article text for articles stored with only the feed's teaser
 * (body ending in "…", or shorter than an article), and translate it.
 *
 * Usage:
 *   npm run content:refetch -- --dry-run            # how many teaser articles, by source (no requests)
 *   npm run content:refetch                         # latest 300 teaser articles
 *   npm run content:refetch -- --limit=2000
 *   npm run content:refetch -- --source="Al Jazeera" --limit=500
 *   npm run content:refetch -- --no-translate       # store the full original only
 *
 * Exit codes: 0 done · 1 fatal error · 3 the OpenAI account is out of credits.
 */

import './quiet-deprecations'; // must stay first: hides the harmless punycode warning from openai's deps
import { PrismaClient } from '@prisma/client';
import { parseIntParam } from '../lib/utils';
import { refetchTeaserBodies, selectTeaserArticles } from './refetch-bodies';

function parseArgs(argv: string[]) {
  const opts = { limit: 300, dryRun: false, translate: true, source: undefined as string | undefined };
  for (const arg of argv) {
    const eq = arg.indexOf('=');
    const key = eq === -1 ? arg : arg.slice(0, eq);
    const value = eq === -1 ? '' : arg.slice(eq + 1);
    if (key === '--limit') opts.limit = parseIntParam(value, { min: 1, max: 200000, fallback: 300 });
    else if (key === '--dry-run') opts.dryRun = true;
    else if (key === '--no-translate') opts.translate = false;
    else if (key === '--source') opts.source = value.replace(/^["']|["']$/g, '') || undefined;
    else console.warn(`[content:refetch] Unknown argument ignored: ${arg}`);
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const prisma = new PrismaClient();
  try {
    if (opts.dryRun) {
      const rows = await selectTeaserArticles(prisma, opts.limit, opts.source);
      const by = new Map<string, number>();
      for (const r of rows) by.set(r.sourceName, (by.get(r.sourceName) ?? 0) + 1);
      console.log(`[content:refetch] ${rows.length} teaser article(s) among the latest selection (limit ${opts.limit}):`);
      for (const [s, n] of Array.from(by.entries()).sort((a, b) => b[1] - a[1])) console.log(`  ${s.padEnd(18)} ${n}`);
      console.log('[content:refetch] Dry run — nothing was fetched or changed.');
      return;
    }
    if (opts.translate && !process.env.OPENAI_API_KEY?.trim()) {
      console.warn('[content:refetch] OPENAI_API_KEY is not set — full originals will be stored without translation.');
      opts.translate = false;
    }

    const res = await refetchTeaserBodies(prisma, opts);

    const by = new Map<string, Record<string, number>>();
    for (const o of res.outcomes) {
      const row = by.get(o.source) ?? { improved: 0, unchanged: 0, unavailable: 0, 'skipped-host': 0 };
      row[o.result]++;
      by.set(o.source, row);
    }
    console.log('\n  매체                 전문확보  변화없음  가져올수없음  차단(건너뜀)');
    for (const [s, r] of Array.from(by.entries()).sort((a, b) => b[1].improved - a[1].improved)) {
      console.log(`  ${s.padEnd(20)} ${String(r.improved).padStart(6)} ${String(r.unchanged).padStart(8)} ${String(r.unavailable).padStart(11)} ${String(r['skipped-host']).padStart(11)}`);
    }

    try {
      const { redis } = await import('../lib/redis');
      if (redis) {
        const keys = await redis.keys('*');
        if (keys.length > 0) await redis.del(...keys);
        await redis.quit();
      }
    } catch (err) {
      console.warn('[content:refetch] Cache clear skipped:', err instanceof Error ? err.message : err);
    }

    const improved = res.outcomes.filter((o) => o.result === 'improved');
    console.log(
      `\n[content:refetch] Done: ${res.candidates} teaser article(s) checked, ${improved.length} now have the full text ` +
        `(${improved.filter((o) => o.translated).length} translated).`,
    );
    if (res.api.billingBlocked) {
      console.error('[content:refetch] ✗ The OpenAI account has no credits left — full originals were stored untranslated.');
      console.error('                   Add credits, then: npm run backfill:translations -- --content');
      process.exitCode = 3;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[content:refetch] Fatal error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
