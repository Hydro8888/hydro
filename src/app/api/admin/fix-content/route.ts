import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { fetchArticlePage } from '@/workers/scraper';

export const dynamic = 'force-dynamic';

/** GET: Dry-run — report how many articles have short content */
export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: { isActive: true },
      select: { id: true, titleKo: true, titleOriginal: true, contentOriginal: true, originalUrl: true },
    });

    const shortArticles = articles.filter(
      (a) => !a.contentOriginal || a.contentOriginal.length <= 500,
    );
    const noContent = articles.filter((a) => !a.contentOriginal);

    return NextResponse.json({
      total: articles.length,
      short: shortArticles.length,
      noContent: noContent.length,
      samples: shortArticles.slice(0, 10).map((a) => ({
        id: a.id,
        title: a.titleKo || a.titleOriginal,
        contentLength: a.contentOriginal?.length || 0,
        url: a.originalUrl,
      })),
      message: `${shortArticles.length} of ${articles.length} articles have short content (<=500 chars)`,
    });
  } catch (error) {
    console.error('[GET /api/admin/fix-content]', error);
    return NextResponse.json({ error: 'Failed to check content' }, { status: 500 });
  }
}

/** POST: Re-scrape articles with short content and update DB */
export async function POST() {
  try {
    const articles = await prisma.article.findMany({
      where: { isActive: true },
      select: { id: true, contentOriginal: true, originalUrl: true },
    });

    const shortArticles = articles.filter(
      (a) => !a.contentOriginal || a.contentOriginal.length <= 500,
    );

    if (shortArticles.length === 0) {
      return NextResponse.json({ fixed: 0, message: 'No short articles found' });
    }

    let fixed = 0;
    let failed = 0;
    const batchSize = 10;

    for (let i = 0; i < shortArticles.length; i += batchSize) {
      const batch = shortArticles.slice(i, i + batchSize);

      for (const article of batch) {
        try {
          const { content } = await fetchArticlePage(article.originalUrl);

          if (content && content.length > (article.contentOriginal?.length || 0)) {
            await prisma.article.update({
              where: { id: article.id },
              data: {
                contentOriginal: content,
                contentKo: null, // Clear so next collect cycle re-translates
              },
            });
            fixed++;
          }
        } catch {
          failed++;
        }

        // Polite delay between requests
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    return NextResponse.json({
      fixed,
      failed,
      total: shortArticles.length,
      message: `Re-scraped ${fixed} articles with longer content (${failed} failed)`,
    });
  } catch (error) {
    console.error('[POST /api/admin/fix-content]', error);
    return NextResponse.json({ error: 'Failed to fix content' }, { status: 500 });
  }
}
