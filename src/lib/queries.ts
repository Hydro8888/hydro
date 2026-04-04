import { prisma } from './db';
import { getCached } from './redis';

// ---------------------------------------------------------------------------
// Shared data-fetching functions used across pages
// ---------------------------------------------------------------------------

/** Fetch articles for home page, optionally filtered by country */
export async function getArticles(country?: string) {
  try {
    const where: Record<string, unknown> = { isActive: true };
    if (country && country !== 'all') where.country = country;

    return await getCached(`home:${country || 'all'}`, 60, () =>
      prisma.article.findMany({
        where,
        include: { source: true },
        orderBy: { publishedAt: 'desc' },
        take: 30,
      })
    );
  } catch {
    return [];
  }
}

/** Fetch breaking / latest news for ticker and breaking page */
export async function getBreakingNews() {
  try {
    return await getCached('breaking', 60, () =>
      prisma.article.findMany({
        where: { isActive: true },
        include: { source: true },
        orderBy: { publishedAt: 'desc' },
        take: 10,
      })
    );
  } catch {
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
  } catch {
    return [];
  }
}

/** Paginated articles for a specific country */
export async function getCountryArticles(countryCode: string, page: number) {
  const take = 20;
  const skip = (page - 1) * take;

  try {
    return await getCached(`${countryCode}:${page}`, 60, async () => {
      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where: { country: countryCode, isActive: true },
          include: { source: true },
          orderBy: { publishedAt: 'desc' },
          take,
          skip,
        }),
        prisma.article.count({ where: { country: countryCode, isActive: true } }),
      ]);
      return { articles, total, totalPages: Math.ceil(total / take) };
    });
  } catch {
    return { articles: [], total: 0, totalPages: 0 };
  }
}

/** Paginated breaking articles */
export async function getBreakingArticles(page: number) {
  const take = 30;
  const skip = (page - 1) * take;

  try {
    return await getCached(`breaking:${page}`, 30, async () => {
      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where: { isActive: true },
          include: { source: true },
          orderBy: { publishedAt: 'desc' },
          take,
          skip,
        }),
        prisma.article.count({ where: { isActive: true } }),
      ]);
      return { articles, total, totalPages: Math.ceil(total / take) };
    });
  } catch {
    return { articles: [], total: 0, totalPages: 0 };
  }
}

/** Ranked articles by view count */
export async function getRankingArticles(country: string) {
  const where: Record<string, unknown> = { isActive: true };
  if (country && country !== 'all') where.country = country;

  try {
    return await getCached(`ranking:${country}`, 120, () =>
      prisma.article.findMany({
        where,
        include: { source: true },
        orderBy: { viewCount: 'desc' },
        take: 30,
      })
    );
  } catch {
    return [];
  }
}

/** Group articles by their primary category (pure function, no DB) */
export function groupByCategory(
  articles: { categoryPrimary: string | null }[]
): Record<string, typeof articles> {
  return articles.reduce(
    (acc, article) => {
      const cat = article.categoryPrimary || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(article);
      return acc;
    },
    {} as Record<string, typeof articles>
  );
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
  } catch {
    return [];
  }
}

/** Paginated articles for a specific category */
export async function getCategoryArticles(slug: string, page: number) {
  const take = 20;
  const skip = (page - 1) * take;

  try {
    return await getCached(`cat:${slug}:${page}`, 60, async () => {
      const [articles, total] = await Promise.all([
        prisma.article.findMany({
          where: { categoryPrimary: slug, isActive: true },
          include: { source: true },
          orderBy: { publishedAt: 'desc' },
          take,
          skip,
        }),
        prisma.article.count({ where: { categoryPrimary: slug, isActive: true } }),
      ]);
      return { articles, total, totalPages: Math.ceil(total / take) };
    });
  } catch {
    return { articles: [], total: 0, totalPages: 0 };
  }
}
