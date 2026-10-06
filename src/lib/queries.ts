import { prisma } from './db';
import { getCached } from './redis';
import { BREAKING_ITEMS_PER_PAGE, ITEMS_PER_PAGE } from './constants';

// Main list queries (getArticles, getCountryArticles, getBreakingArticles, getCategoryArticles,
// getRankingArticles) log and RE-THROW database errors so the segment error.tsx shows an honest
// error screen — a DB outage must not look like "no news". Decorative helpers (ticker, category
// counts, trending keywords) still degrade to [] so they never take the whole home page down.

function logDbError(err: unknown): void {
  console.error('[queries] DB error:', err instanceof Error ? err.message : err);
}

// ---------------------------------------------------------------------------
// Shared data-fetching functions used across pages
// ---------------------------------------------------------------------------

/** Fetch the newest articles for the home page, optionally filtered by country. Throws on DB error. */
export async function getArticles(country?: string, take = 30) {
  try {
    const where: Record<string, unknown> = { isActive: true };
    if (country && country !== 'all') where.country = country;

    return await getCached(`home:${country || 'all'}:${take}`, 60, () =>
      prisma.article.findMany({
        where,
        include: { source: true },
        orderBy: { createdAt: 'desc' },
        take,
      })
    );
  } catch (err) {
    logDbError(err);
    throw err;
  }
}

/** Fetch breaking / latest news for ticker and breaking page */
export async function getBreakingNews() {
  try {
    return await getCached('breaking', 60, () =>
      prisma.article.findMany({
        where: { isActive: true },
        include: { source: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    );
  } catch (err) {
    logDbError(err);
    return [];
  }
}

/** Aggregate article counts per category */
export async function getCategoryCounts() {
  try {
    return await getCached('cat-counts', 120, async () => {
      const counts = await prisma.article.groupBy({
        by: ['categoryPrimary'],
        where: { isActive: true },
        _count: true,
      });
      return counts.map((c) => ({ category: c.categoryPrimary, count: c._count }));
    });
  } catch (err) {
    logDbError(err);
    return [];
  }
}

/** Paginated articles for a specific country. Throws on DB error. */
export async function getCountryArticles(countryCode: string, page: number) {
  const take = ITEMS_PER_PAGE;
  const skip = (page - 1) * take;

  try {
    return await getCached(`${countryCode}:${page}`, 60, async () => {
      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where: { country: countryCode, isActive: true },
          include: { source: true },
          orderBy: { createdAt: 'desc' },
          take,
          skip,
        }),
        prisma.article.count({ where: { country: countryCode, isActive: true } }),
      ]);
      return { articles, total, totalPages: Math.ceil(total / take) };
    });
  } catch (err) {
    logDbError(err);
    throw err;
  }
}

/** Paginated breaking articles. Throws on DB error. */
export async function getBreakingArticles(page: number) {
  const take = BREAKING_ITEMS_PER_PAGE;
  const skip = (page - 1) * take;

  try {
    return await getCached(`breaking:${page}`, 30, async () => {
      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where: { isActive: true },
          include: { source: true },
          orderBy: { createdAt: 'desc' },
          take,
          skip,
        }),
        prisma.article.count({ where: { isActive: true } }),
      ]);
      return { articles, total, totalPages: Math.ceil(total / take) };
    });
  } catch (err) {
    logDbError(err);
    throw err;
  }
}

/** Ranked articles by view count. Throws on DB error. */
export async function getRankingArticles(country: string) {
  const where: Record<string, unknown> = { isActive: true };
  if (country && country !== 'all') where.country = country;

  try {
    return await getCached(`ranking:${country}`, 120, () =>
      prisma.article.findMany({
        where,
        include: { source: true },
        orderBy: [{ viewCount: 'desc' }, { id: 'desc' }],
        take: 30,
      })
    );
  } catch (err) {
    logDbError(err);
    throw err;
  }
}

/** Group articles by their primary category (pure function, no DB). Keeps the element type. */
export function groupByCategory<T extends { categoryPrimary: string | null }>(articles: T[]): Record<string, T[]> {
  const acc: Record<string, T[]> = {};
  for (const article of articles) {
    const cat = article.categoryPrimary || 'general';
    if (!Object.prototype.hasOwnProperty.call(acc, cat)) acc[cat] = [];
    acc[cat].push(article);
  }
  return acc;
}

/** Trending keywords based on category counts */
export async function getTrendingKeywords() {
  try {
    return await getCached('trending-kw', 300, async () => {
      const counts = await prisma.article.groupBy({
        by: ['categoryPrimary'],
        where: { isActive: true },
        _count: true,
        orderBy: { _count: { categoryPrimary: 'desc' } },
        take: 10,
      });
      return counts.map((c) => ({
        keyword: c.categoryPrimary || 'general',
        count: c._count,
      }));
    });
  } catch (err) {
    logDbError(err);
    return [];
  }
}

/** Paginated articles for a specific category. Throws on DB error. */
export async function getCategoryArticles(slug: string, page: number) {
  const take = ITEMS_PER_PAGE;
  const skip = (page - 1) * take;

  try {
    return await getCached(`cat:${slug}:${page}`, 60, async () => {
      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where: { categoryPrimary: slug, isActive: true },
          include: { source: true },
          orderBy: { createdAt: 'desc' },
          take,
          skip,
        }),
        prisma.article.count({ where: { categoryPrimary: slug, isActive: true } }),
      ]);
      return { articles, total, totalPages: Math.ceil(total / take) };
    });
  } catch (err) {
    logDbError(err);
    throw err;
  }
}
