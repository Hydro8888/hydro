import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

/**
 * Clears the Redis cache. Useful when stale or empty data has been cached
 * and the homepage is showing the empty state ("뉴스를 불러오는 중") even
 * though the DB has articles.
 *
 * GET: report cache key count
 * POST: flush all cache keys
 */
export async function GET() {
  if (!redis) {
    return NextResponse.json({ error: 'Redis not configured' }, { status: 503 });
  }
  try {
    const keys = await redis.keys('*');
    return NextResponse.json({
      totalKeys: keys.length,
      sample: keys.slice(0, 20),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST() {
  if (!redis) {
    return NextResponse.json({ error: 'Redis not configured' }, { status: 503 });
  }
  try {
    const keys = await redis.keys('*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return NextResponse.json({
      cleared: keys.length,
      message: `Cleared ${keys.length} cache keys`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
