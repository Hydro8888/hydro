/**
 * scraper.ts
 * Fetches the full article text AND image from the original URL.
 * Enhanced with JSON-LD extraction and site-specific patterns.
 */

import type { NormalizedArticle } from './normalizer';

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/\n\s*\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 20)
    .join('\n')
    .trim();
}

/**
 * Extract article body from JSON-LD structured data.
 * Most modern news sites embed article content in JSON-LD.
 */
function extractFromJsonLd(html: string): string {
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      // Handle single object or array
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        // Check for NewsArticle, Article, etc.
        if (item['@type'] && /Article|NewsArticle|ReportageNewsArticle|BlogPosting/i.test(item['@type'])) {
          // articleBody is the full text
          if (item.articleBody && item.articleBody.length > 100) {
            return item.articleBody.slice(0, 8000);
          }
          // description as fallback
          if (item.description && item.description.length > 100) {
            return item.description;
          }
        }
        // Check @graph structure (used by many CMSes)
        if (item['@graph'] && Array.isArray(item['@graph'])) {
          for (const node of item['@graph']) {
            if (node['@type'] && /Article|NewsArticle/i.test(node['@type'])) {
              if (node.articleBody && node.articleBody.length > 100) {
                return node.articleBody.slice(0, 8000);
              }
            }
          }
        }
      }
    } catch { /* Invalid JSON, skip */ }
  }
  return '';
}

/**
 * Extract og:image or twitter:image from HTML meta tags.
 */
function extractOgImage(html: string): string {
  const ogMatch = html.match(/<meta\s[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta\s[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogMatch?.[1]) return ogMatch[1];

  const twMatch = html.match(/<meta\s[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta\s[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
  if (twMatch?.[1]) return twMatch[1];

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
 * Extract article body from HTML page using multiple strategies.
 */
function extractArticleContent(html: string): string {
  // Strategy 1: JSON-LD structured data (most reliable)
  const jsonLdContent = extractFromJsonLd(html);
  if (jsonLdContent.length > 100) {
    console.log(`[scraper] Got content from JSON-LD (${jsonLdContent.length} chars)`);
    return jsonLdContent;
  }

  // Strategy 2: Site-specific and semantic HTML patterns
  const patterns = [
    // Specific news site patterns
    /<div[^>]*class="[^"]*ssrcss[^"]*"[^>]*data-component="text-block"[^>]*>([\s\S]*?)<\/div>/gi, // BBC
    /<div[^>]*class="[^"]*article__body[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, // CNN
    /<div[^>]*class="[^"]*content--body[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, // Guardian
    /<div[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, // Reuters/generic
    /<div[^>]*class="[^"]*story-body[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, // BBC legacy
    // Generic semantic patterns
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<div[^>]*class="[^"]*article[_-]?(?:body|content|text|copy)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*story[_-]?(?:body|content|text)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*post[_-]?(?:content|body)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*entry[_-]?content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*content[_-]?(?:body|area|main)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*(?:body|text)[_-]?(?:content|copy|text)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*id="article[_-]?(?:body|content)"[^>]*>([\s\S]*?)<\/div>/gi,
    /<section[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/section>/gi,
    /<main[^>]*>([\s\S]*?)<\/main>/gi,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0; // Reset regex state
    const match = pattern.exec(html);
    if (match && match[1]) {
      const text = stripHtml(match[1]);
      if (text.length > 100) {
        console.log(`[scraper] Got content from HTML pattern (${text.length} chars)`);
        return text.slice(0, 8000);
      }
    }
  }

  // Strategy 3: Extract ALL <p> tags (aggressive fallback)
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(html)) !== null) {
    const text = stripHtml(pMatch[1]).trim();
    if (text.length > 20) {
      paragraphs.push(text);
    }
  }

  if (paragraphs.length >= 2) {
    const joined = paragraphs.join('\n');
    console.log(`[scraper] Got content from <p> tags (${joined.length} chars, ${paragraphs.length} paragraphs)`);
    return joined.slice(0, 8000);
  }

  // Strategy 4: og:description meta tag as absolute last resort
  const descMatch = html.match(/<meta\s[^>]*(?:property=["']og:description["']|name=["']description["'])[^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta\s[^>]*content=["']([^"']+)["'][^>]*(?:property=["']og:description["']|name=["']description["'])/i);
  if (descMatch?.[1] && descMatch[1].length > 50) {
    console.log(`[scraper] Got content from meta description (${descMatch[1].length} chars)`);
    return descMatch[1];
  }

  return '';
}

interface ScrapedPage {
  content: string;
  imageUrl: string;
}

async function fetchArticlePage(url: string): Promise<ScrapedPage> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.log(`[scraper] HTTP ${res.status} for ${url.slice(0, 60)}`);
      return { content: '', imageUrl: '' };
    }

    const html = await res.text();
    return {
      content: extractArticleContent(html),
      imageUrl: extractOgImage(html),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (!msg.includes('abort')) {
      console.log(`[scraper] Fetch error for ${url.slice(0, 60)}: ${msg}`);
    }
    return { content: '', imageUrl: '' };
  }
}

export async function scrapeArticleContents(
  articles: NormalizedArticle[],
): Promise<NormalizedArticle[]> {
  const needsScraping = articles.filter(
    (a) => !a.contentOriginal || a.contentOriginal.length < 500 || !a.imageUrl
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

    if (content && content.length > 100 && content.length > (article.contentOriginal?.length || 0)) {
      article.contentOriginal = content;
      scrapedContent++;
    }

    if (imageUrl && !article.imageUrl) {
      article.imageUrl = imageUrl;
      scrapedImages++;
    }

    // Polite delay
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log(`[scraper] Done: ${scrapedContent} content, ${scrapedImages} images scraped`);
  return articles;
}
