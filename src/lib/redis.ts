import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis | null };

function createRedis(): Redis | null {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 500, 3000);
      },
    });
    client.on('error', (err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Redis]', err.message);
      }
    });
    return client;
  } catch {
    return null;
  }
}

export const redis = globalForRedis.redis !== undefined ? globalForRedis.redis : createRedis();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export async function getCached<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) return JSON.parse(cached) as T;
    } catch { /* redis unavailable */ }
  }

  const data = await fetcher();

  // Don't cache empty results — this prevents "stuck" empty states
  // when the DB query temporarily fails or returns no rows.
  const isEmpty =
    data == null ||
    (Array.isArray(data) && data.length === 0) ||
    (typeof data === 'object' && data !== null && 'articles' in data && Array.isArray((data as { articles: unknown[] }).articles) && (data as { articles: unknown[] }).articles.length === 0);

  if (redis && !isEmpty) {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch { /* ignore */ }
  }

  return data;
}

export async function invalidateCache(pattern: string) {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch { /* ignore */ }
}

export default redis;
