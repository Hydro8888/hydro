import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

export async function checkTokenQuota(
  userId: string,
  periodKey: string,
  limit: number,
  tokensToAdd: number
): Promise<{ allowed: boolean; current: number }> {
  const key = `usage:${userId}:${periodKey}`;
  const current = await redis.incrby(key, tokensToAdd);

  if (current === tokensToAdd) {
    await redis.expire(key, 31 * 24 * 60 * 60);
  }

  if (current > limit) {
    await redis.decrby(key, tokensToAdd);
    return { allowed: false, current: current - tokensToAdd };
  }

  return { allowed: true, current };
}

export async function getTokenUsage(
  userId: string,
  periodKey: string
): Promise<number> {
  const key = `usage:${userId}:${periodKey}`;
  const val = await redis.get(key);
  return val ? parseInt(val, 10) : 0;
}
