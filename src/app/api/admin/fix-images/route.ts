import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isValidArticleImage } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/** GET: Dry-run — report how many articles have bad image URLs */
export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: { imageUrl: { not: null }, isActive: true },
      select: { id: true, imageUrl: true },
    });

    const badArticles = articles.filter(a => !isValidArticleImage(a.imageUrl));

    return NextResponse.json({
      total: articles.length,
      bad: badArticles.length,
      samples: badArticles.slice(0, 10).map(a => ({
        id: a.id,
        imageUrl: a.imageUrl,
      })),
      message: `${badArticles.length} of ${articles.length} articles have invalid image URLs`,
    });
  } catch (error) {
    console.error('[GET /api/admin/fix-images]', error);
    return NextResponse.json(
      { error: 'Failed to check images' },
      { status: 500 },
    );
  }
}

/** POST: Clear bad image URLs so fallback/regeneration can work */
export async function POST() {
  try {
    const articles = await prisma.article.findMany({
      where: { imageUrl: { not: null }, isActive: true },
      select: { id: true, imageUrl: true },
    });

    const badArticles = articles.filter(a => !isValidArticleImage(a.imageUrl));

    if (badArticles.length === 0) {
      return NextResponse.json({ fixed: 0, total: articles.length, message: 'No bad images found' });
    }

    // Clear bad image URLs so frontend fallback and future AI generation can work
    const result = await prisma.article.updateMany({
      where: { id: { in: badArticles.map(a => a.id) } },
      data: { imageUrl: null },
    });

    return NextResponse.json({
      fixed: result.count,
      total: articles.length,
      message: `Cleared ${result.count} bad image URLs`,
    });
  } catch (error) {
    console.error('[POST /api/admin/fix-images]', error);
    return NextResponse.json(
      { error: 'Failed to fix images' },
      { status: 500 },
    );
  }
}
