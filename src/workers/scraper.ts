/**
 * scraper.ts
 * Fetches the full article text from the original URL.
 * Uses simple HTTP fetch + HTML parsing (no headless browser).
 */

import type { NormalizedArticle } from './normalizer';

/**
 * Strip HTML tags and decode entities to get plain text.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 30) // Only keep meaningful lines
    .join('\n')
    .trim();
}

/**
 * Extract article body from HTML page.
 * Looks for common article content containers.
 */
function extractArticleContent(html: string): string {
  // Try to find the main article content using common selectors
  const patterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<div[^>]*class="[^"]*article[_-]?(?:body|content|text)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*story[_-]?(?:body|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*post[_-]?(?:content|body)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*entry[_-]?content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*content[_-]?body[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*id="article[_-]?(?:body|content)"[^>]*>([\s\S]*?)<\/div>/gi,
    /<main[^>]*>([\s\S]*?)<\/main>/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match && match[1]) {
      const text = stripHtml(match[1]);
      if (text.length > 100) {
        return text.slice(0, 5000); // Limit to 5000 chars
      }
    }
  }

  // Fallback: extract all <p> tags
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(html)) !== null) {
    const text = stripHtml(pMatch[1]).trim();
    if (text.length > 40) { // Only meaningful paragraphs
      paragraphs.push(text);
    }
  }

  if (paragraphs.length > 0) {
    return paragraphs.join('\n').slice(0, 5000);
  }

  return '';
}

/**
 * Fetch full article content from the original URL.
 * Returns the extracted text or empty string on failure.
 */
async function fetchArticleContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LiveNewsBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return '';

    const html = await res.text();
    return extractArticleContent(html);
  } catch {
    return '';
  }
}

/**
 * Scrape full article content for articles that lack contentOriginal.
 * Processes articles sequentially with delays to be polite.
 */
export async function scrapeArticleContents(
  articles: NormalizedArticle[],
): Promise<NormalizedArticle[]> {
  const needsScraping = articles.filter(
    (a) => !a.contentOriginal || a.contentOriginal.length < 100
  );

  if (needsScraping.length === 0) {
    console.log('[scraper] All articles already have content');
    return articles;
  }

  console.log(`[scraper] Scraping content for ${needsScraping.length}/${articles.length} articles...`);

  let scraped = 0;
  for (const article of needsScraping) {
    const content = await fetchArticleContent(article.originalUrl);
    if (content && content.length > 100) {
      article.contentOriginal = content;
      scraped++;
      console.log(`[scraper] Got ${content.length} chars from ${article.originalUrl.slice(0, 60)}...`);
    }

    // Polite delay between requests (1 second)
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`[scraper] Scraped ${scraped}/${needsScraping.length} articles successfully`);
  return articles;
}
