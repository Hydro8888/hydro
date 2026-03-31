/**
 * scheduler.ts
 * PM2 entry point for the news-collection worker process.
 *
 * Behaviour:
 *   - Runs collectAll() immediately on startup.
 *   - Schedules collectAll() to run every 3 hours via node-cron.
 *   - Logs start/end times and duration for every run.
 *   - Handles overlapping runs gracefully (skips if a run is already in progress).
 *   - Disconnects Prisma and Redis cleanly on SIGTERM / SIGINT.
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { collectAll } from './collector';

// ---------------------------------------------------------------------------
// Shared client references — kept here so the shutdown handler can reach them.
// collector.ts creates its own instances internally; we create lightweight ones
// here solely for the graceful-shutdown disconnect calls.
// ---------------------------------------------------------------------------

const prisma = new PrismaClient();

function createRedis(): Redis {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  return new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
}

const redis = createRedis();

// ---------------------------------------------------------------------------
// Run state — prevents concurrent collection runs
// ---------------------------------------------------------------------------

let isRunning = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timestamp(): string {
  return new Date().toISOString();
}

/**
 * Wraps collectAll() with start/end logging, elapsed-time reporting, and
 * a guard against concurrent executions.
 */
async function runCollection(): Promise<void> {
  if (isRunning) {
    console.warn(`[scheduler] ${timestamp()} — Collection already in progress, skipping this trigger`);
    return;
  }

  isRunning = true;
  const startTime = Date.now();
  console.log(`[scheduler] ${timestamp()} — Collection run STARTED`);

  try {
    await collectAll();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[scheduler] ${timestamp()} — Collection run FAILED with unexpected error: ${message}`);
  } finally {
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[scheduler] ${timestamp()} — Collection run FINISHED (${elapsedSec}s)`);
    isRunning = false;
  }
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

async function shutdown(signal: string): Promise<void> {
  console.log(`[scheduler] Received ${signal} — shutting down gracefully…`);
  try {
    await prisma.$disconnect();
    console.log('[scheduler] Prisma disconnected');
  } catch (err) {
    console.warn('[scheduler] Prisma disconnect error (non-fatal):', err);
  }
  try {
    await redis.quit();
    console.log('[scheduler] Redis disconnected');
  } catch (err) {
    console.warn('[scheduler] Redis quit error (non-fatal):', err);
  }
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ---------------------------------------------------------------------------
// Schedule — every 4 hours, on the hour (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
// ---------------------------------------------------------------------------

const CRON_SCHEDULE = '0 */4 * * *';

console.log(`[scheduler] ${timestamp()} — Starting Hydro news collector`);
console.log(`[scheduler] Cron schedule: "${CRON_SCHEDULE}" (every 4 hours)`);

// Run immediately at startup so there is no cold-start gap
runCollection().catch((err) => {
  console.error('[scheduler] Initial run error:', err);
});

// Register the recurring schedule
cron.schedule(CRON_SCHEDULE, () => {
  console.log(`[scheduler] ${timestamp()} — Cron trigger fired`);
  runCollection().catch((err) => {
    console.error('[scheduler] Scheduled run error:', err);
  });
}, {
  timezone: 'UTC',
});

console.log(`[scheduler] ${timestamp()} — Cron job registered. Scheduler is running.`);
