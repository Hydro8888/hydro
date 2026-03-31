import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis };

function createRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  return new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true });
}

export const redis = globalForRedis.redis || createRedis();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export async function getCached<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch { /* redis unavailable, fallback to fetcher */ }

  const data = await fetcher();

  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch { /* ignore cache write failures */ }

  return data;
}

export async function invalidateCache(pattern: string) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch { /* ignore */ }
}

export default redis;
