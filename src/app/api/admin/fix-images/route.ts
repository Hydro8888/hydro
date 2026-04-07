import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isValidArticleImage, normalizeImageUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/** GET: Dry-run — report how many articles have bad or non-normalized image URLs */
export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: { imageUrl: { not: null }, isActive: true },
      select: { id: true, imageUrl: true },
    });

    const needsNormalization = articles.filter(a => {
      const normalized = normalizeImageUrl(a.imageUrl);
      return normalized !== a.imageUrl;
    });

    const badArticles = articles.filter(a => !isValidArticleImage(normalizeImageUrl(a.imageUrl)));

    return NextResponse.json({
      total: articles.length,
      needsNormalization: needsNormalization.length,
      bad: badArticles.length,
      normalizationSamples: needsNormalization.slice(0, 10).map(a => ({
        id: a.id,
        before: a.imageUrl,
        after: normalizeImageUrl(a.imageUrl),
      })),
      badSamples: badArticles.slice(0, 10).map(a => ({
        id: a.id,
        imageUrl: a.imageUrl,
      })),
      message: `${needsNormalization.length} need normalization, ${badArticles.length} are invalid`,
    });
  } catch (error) {
    console.error('[GET /api/admin/fix-images]', error);
    return NextResponse.json(
      { error: 'Failed to check images' },
      { status: 500 },
    );
  }
}

/** POST: Normalize image URLs (http→https, //→https://) and clear truly bad ones */
export async function POST() {
  try {
    const articles = await prisma.article.findMany({
      where: { imageUrl: { not: null }, isActive: true },
      select: { id: true, imageUrl: true },
    });

    let normalizedCount = 0;
    let clearedCount = 0;

    for (const article of articles) {
      const normalized = normalizeImageUrl(article.imageUrl);

      if (!normalized || !isValidArticleImage(normalized)) {
        // Clear truly bad URLs
        await prisma.article.update({
          where: { id: article.id },
          data: { imageUrl: null },
        });
        clearedCount++;
      } else if (normalized !== article.imageUrl) {
        // Update with normalized URL (http→https, //→https://)
        await prisma.article.update({
          where: { id: article.id },
          data: { imageUrl: normalized },
        });
        normalizedCount++;
      }
    }

    return NextResponse.json({
      total: articles.length,
      normalized: normalizedCount,
      cleared: clearedCount,
      message: `Normalized ${normalizedCount} URLs, cleared ${clearedCount} bad URLs`,
    });
  } catch (error) {
    console.error('[POST /api/admin/fix-images]', error);
    return NextResponse.json(
      { error: 'Failed to fix images' },
      { status: 500 },
    );
  }
}
