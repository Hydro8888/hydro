/**
 * Repair phase of src/workers/backfill.ts (slice S5, QA feedback 1):
 * a failed repair keeps a stored translation that covers the first 6000 chars
 * of the original, and resets a shorter (cut) one to NULL.
 * Fake Prisma + fake chat client — no DB, no network. Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { backfillTranslations } from '../src/workers/backfill';
import { legacyPrefixParagraphs } from '../src/workers/translation-text';
import type { ChatClient } from '../src/lib/xai-client';

const EN = 'Market analysts said the decision could mark a turning point for the broader economy, although risks remain elevated across several sectors.';
const orig = Array.from({ length: 60 }, () => EN).join('\n');
const ko = (n: number) => Array.from({ length: n }, () => '번역된 문단').join('\n');

function fakePrisma(rows: Array<{ id: number; contentKo: string | null }>) {
  const updates: Array<{ id: number; data: Record<string, unknown> }> = [];
  const prisma = {
    // tagged-template calls from translation-coverage.ts
    async $queryRaw(strings: TemplateStringsArray) {
      const sql = strings.join('?');
      if (sql.includes('count(*) FILTER')) {
        return [{ untranslatedTitles: 0, untranslatedBodies: 0, missingSummaries: 0, truncatedBodies: 0, activeForeign: rows.length }];
      }
      return rows.map((r) => ({ id: r.id }));
    },
    article: {
      async findMany() {
        return rows.map((r) => ({ id: r.id, contentOriginal: orig, contentKo: r.contentKo, language: 'en' }));
      },
      async update(args: { where: { id: number }; data: Record<string, unknown> }) {
        updates.push({ id: args.where.id, data: args.data });
        return {};
      },
    },
  };
  return { prisma: prisma as any, updates };
}

/** Always answers with finish_reason "length" → the repair cannot complete. */
const alwaysCut: ChatClient = {
  chat: {
    completions: {
      create: async () => ({ choices: [{ message: { content: '번역' }, finish_reason: 'length' }] }),
    },
  },
};

test('failed repair: prefix-covering translation kept, shorter one reset to NULL', async () => {
  const prefix = legacyPrefixParagraphs(orig);
  const { prisma, updates } = fakePrisma([
    { id: 2, contentKo: ko(prefix) }, // covers everything the old translator was sent
    { id: 1, contentKo: ko(12) }, // cut by max_tokens
  ]);
  const stats = await backfillTranslations(prisma, {
    titleLimit: 0,
    contentLimit: 0,
    repairLimit: 10,
    client: alwaysCut,
    articlePauseMs: 0,
  });
  assert.equal(stats.repaired, 0);
  assert.equal(stats.repairKept, 1);
  assert.equal(stats.repairReset, 1);
  assert.deepEqual(updates, [{ id: 1, data: { contentKo: null } }]);
});
