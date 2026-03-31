/**
 * scraper.ts
 * Fetches the full article text AND image from the original URL.
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
    .filter(l => l.length > 30)
    .join('\n')
    .trim();
}

/**
 * Extract og:image or twitter:image from HTML meta tags.
 */
function extractOgImage(html: string): string {
  // og:image
  const ogMatch = html.match(/<meta\s[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta\s[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogMatch?.[1]) return ogMatch[1];

  // twitter:image
  const twMatch = html.match(/<meta\s[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta\s[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
  if (twMatch?.[1]) return twMatch[1];

  // generic image meta
  const imgMeta = html.match(/<meta\s[^>]*name=["']image["'][^>]*content=["']([^"']+)["']/i);
  if (imgMeta?.[1]) return imgMeta[1];

  // First large image in article
  const imgTag = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*(?:width=["'](\d+)["'])?/gi);
  if (imgTag) {
    for (const tag of imgTag) {
      const srcMatch = tag.match(/src=["']([^"']+)["']/i);
      const widthMatch = tag.match(/width=["'](\d+)["']/i);
      if (srcMatch?.[1]) {
        const src = srcMatch[1];
        // Skip tiny images (icons, logos, tracking pixels)
        if (widthMatch && parseInt(widthMatch[1]) < 200) continue;
        if (src.includes('logo') || src.includes('icon') || src.includes('avatar')) continue;
        if (src.includes('1x1') || src.includes('pixel') || src.includes('tracking')) continue;
        if (src.endsWith('.gif') && !src.includes('giphy')) continue;
        return src;
      }
    }
  }

  return '';
}

/**
 * Extract article body from HTML page.
 */
function extractArticleContent(html: string): string {
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
        return text.slice(0, 5000);
      }
    }
  }

  // Fallback: extract all <p> tags
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(html)) !== null) {
    const text = stripHtml(pMatch[1]).trim();
    if (text.length > 40) {
      paragraphs.push(text);
    }
  }

  if (paragraphs.length > 0) {
    return paragraphs.join('\n').slice(0, 5000);
  }

  return '';
}

interface ScrapedPage {
  content: string;
  imageUrl: string;
}

/**
 * Fetch article page and extract both content and image.
 */
async function fetchArticlePage(url: string): Promise<ScrapedPage> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return { content: '', imageUrl: '' };

    const html = await res.text();
    return {
      content: extractArticleContent(html),
      imageUrl: extractOgImage(html),
    };
  } catch {
    return { content: '', imageUrl: '' };
  }
}

/**
 * Scrape full article content AND images for articles.
 * Updates contentOriginal and imageUrl on each article.
 */
export async function scrapeArticleContents(
  articles: NormalizedArticle[],
): Promise<NormalizedArticle[]> {
  const needsScraping = articles.filter(
    (a) => !a.contentOriginal || a.contentOriginal.length < 100 || !a.imageUrl
  );

  if (needsScraping.length === 0) {
    console.log('[scraper] All articles already have content and images');
    return articles;
  }

  console.log(`[scraper] Scraping ${needsScraping.length}/${articles.length} articles...`);

  let scrapedContent = 0;
  let scrapedImages = 0;

  for (const article of needsScraping) {
    const { content, imageUrl } = await fetchArticlePage(article.originalUrl);

    if (content && content.length > 100 && (!article.contentOriginal || article.contentOriginal.length < 100)) {
      article.contentOriginal = content;
      scrapedContent++;
    }

    if (imageUrl && !article.imageUrl) {
      article.imageUrl = imageUrl;
      scrapedImages++;
      console.log(`[scraper] Got image from ${article.originalUrl.slice(0, 50)}...`);
    }

    // Polite delay
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`[scraper] Done: ${scrapedContent} content, ${scrapedImages} images scraped`);
  return articles;
}
