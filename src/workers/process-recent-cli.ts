/**
 * process-recent-cli.ts
 * AI-process only the most recent articles: Korean title + summary, Korean
 * body, and an AI image for articles without a usable photo.
 *
 * Usage:
 *   npm run ai:recent                       # latest 30 articles, translation + images
 *   npm run ai:recent -- --dry-run          # show what would be done + request estimate, no API calls
 *   npm run ai:recent -- --limit=50         # latest 50 (1..500)
 *   npm run ai:recent -- --no-images        # translation only
 *   npm run ai:recent -- --retranslate      # translate again even if Korean text exists
 *
 * Exit codes: 0 done · 1 config/fatal error · 2 every API request failed ·
 * 3 the OpenAI account is out of credits.
 */

import { PrismaClient } from '@prisma/client';
import { describeAiEndpoint, isImageGenerationEnabled, resolveImageModel, resolveTextModel } from '../lib/ai-client';
import { parseIntParam } from '../lib/utils';
import { estimateRequests, processRecentArticles, selectRecentArticles, planArticleWork } from './recent-processor';

interface CliOptions {
  limit: number;
  images: boolean;
  retranslate: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { limit: 30, images: true, retranslate: false, dryRun: false };
  for (const arg of argv) {
    const [key, value] = arg.split('=', 2);
    if (key === '--limit') opts.limit = parseIntParam(value, { min: 1, max: 500, fallback: 30 });
    else if (key === '--no-images') opts.images = false;
    else if (key === '--retranslate') opts.retranslate = true;
    else if (key === '--dry-run') opts.dryRun = true;
    else console.warn(`[ai:recent] Unknown argument ignored: ${arg}`);
  }
  return opts;
}

const mark = (v: boolean | undefined, planned: boolean) => (!planned ? '·' : v === undefined ? '-' : v ? '✓' : '✗');

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const prisma = new PrismaClient();
  try {
    if (!opts.dryRun && !process.env.OPENAI_API_KEY?.trim()) {
      console.error('[ai:recent] ✗ OPENAI_API_KEY is not set. Enter it with:  bash set-ai-key.sh');
      process.exitCode = 1;
      return;
    }

    const rows = await selectRecentArticles(prisma, opts.limit);
    const plans = rows.map((r) => planArticleWork(r, opts));
    const est = estimateRequests(rows, plans);
    const count = (k: 'title' | 'summary' | 'body' | 'image') => plans.filter((p) => p[k]).length;

    console.log(`[ai:recent] endpoint=${describeAiEndpoint()} model=${resolveTextModel()} imageModel=${resolveImageModel()}`);
    console.log(
      `[ai:recent] Latest ${rows.length} article(s): titles ${count('title')}, summaries ${count('summary')}, ` +
        `bodies ${count('body')}, images ${count('image')} to do — about ${est.text} text request(s) + ${est.images} image(s)`,
    );
    if (opts.images && est.images > 0 && !isImageGenerationEnabled()) {
      console.log('[ai:recent] (images are generated for this run only; automatic generation in the collector stays off)');
    }

    if (opts.dryRun) {
      rows.forEach((r, i) => {
        const p = plans[i];
        const todo = [p.title && '제목', p.summary && '요약', p.body && '본문', p.image && '사진'].filter(Boolean).join('·') || '처리할 것 없음';
        console.log(`  #${r.id}  ${todo.padEnd(12)}  ${(r.titleKo || r.titleOriginal).slice(0, 50)}`);
      });
      console.log('[ai:recent] Dry run — nothing was sent or changed.');
      return;
    }

    if (plans.every((p) => !p.title && !p.summary && !p.body && !p.image)) {
      console.log('[ai:recent] Nothing to do — the latest articles are already processed.');
      return;
    }

    const res = await processRecentArticles(prisma, { ...opts, limit: opts.limit });

    console.log('\n  기사      제목 요약 본문 사진  한국어 제목');
    for (const o of res.outcomes) {
      const p = o.plan;
      console.log(
        `  #${String(o.id).padEnd(8)} ${mark(o.title, p.title)}    ${mark(o.summary, p.summary)}    ` +
          `${mark(o.body, p.body)}    ${mark(o.image, p.image)}    ${o.displayTitle.slice(0, 48)}`,
      );
    }
    console.log('  (✓ 완료  ✗ 실패  - 진행 안 됨  · 필요 없음)\n');

    const done = (k: 'title' | 'summary' | 'body' | 'image') => res.outcomes.filter((o) => o[k] === true).length;
    const failed = (k: 'title' | 'summary' | 'body' | 'image') => res.outcomes.filter((o) => o.plan[k] && o[k] !== true).length;

    // Clear cached pages so the new titles / images show immediately
    try {
      const { redis } = await import('../lib/redis');
      if (redis) {
        const keys = await redis.keys('*');
        if (keys.length > 0) await redis.del(...keys);
        await redis.quit();
      }
    } catch (err) {
      console.warn('[ai:recent] Cache clear skipped:', err instanceof Error ? err.message : err);
    }

    if (res.api.billingBlocked) {
      console.error('[ai:recent] ✗ The OpenAI account has no credits left or hit its usage limit.');
      console.error('             Add credits: https://platform.openai.com/settings/organization/billing — then rerun.');
      process.exitCode = 3;
    } else if (res.api.apiCalls > 0 && res.api.apiFailures === res.api.apiCalls) {
      console.error(`[ai:recent] ✗ Every API request failed. Last error: ${res.api.lastError ?? 'unknown'}`);
      console.error('             Check the key with:  bash set-ai-key.sh --check');
      process.exitCode = 2;
    }

    console.log(
      `[ai:recent] Done: titles ${done('title')} ok/${failed('title')} failed; summaries ${done('summary')}/${failed('summary')}; ` +
        `bodies ${done('body')}/${failed('body')}; images ${done('image')}/${failed('image')}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[ai:recent] Fatal error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
