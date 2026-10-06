/**
 * rss-parser.ts
 * Fetches and parses RSS/Atom feeds using the rss-parser package.
 */

import Parser from 'rss-parser';

export interface RawFeedItem {
  title: string;
  link: string;
  pubDate: string | null;
  content: string | null;
  creator: string | null;
  enclosure: { url: string; type?: string; length?: string } | null;
}

// Custom fields to extract from feed items beyond the standard set
type CustomItem = {
  'media:content': { $: { url: string; medium?: string } };
  'media:thumbnail': { $: { url: string } };
  'content:encoded': string;
  'dc:creator': string;
};

const parser = new Parser<Record<string, unknown>, CustomItem>({
  timeout: 30_000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    'Accept-Language': 'en-US,en;q=0.9',
  },
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['content:encoded', 'content:encoded'],
      ['dc:creator', 'dc:creator'],
    ],
  },
});

/**
 * Fetches and parses an RSS or Atom feed URL.
 * Returns an array of normalized raw feed items.
 * Returns an empty array on any error (network, parse, timeout, etc.).
 */
export async function parseRssFeed(feedUrl: string): Promise<RawFeedItem[]> {
  if (!feedUrl) {
    console.warn('[rss-parser] No feed URL provided');
    return [];
  }

  let feed;
  try {
    feed = await parser.parseURL(feedUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[rss-parser] Failed to parse feed: ${feedUrl} — ${message}`);
    return [];
  }

  const items: RawFeedItem[] = (feed.items ?? []).map((item) => {
    // Resolve enclosure: prefer item.enclosure, fall back to media:content
    let enclosure: RawFeedItem['enclosure'] = null;
    if (item.enclosure?.url) {
      enclosure = {
        url: item.enclosure.url,
        type: item.enclosure.type,
        length: item.enclosure.length != null ? String(item.enclosure.length) : undefined,
      };
    } else if (item['media:content']?.$?.url) {
      enclosure = { url: item['media:content'].$.url, type: item['media:content'].$.medium };
    } else if (item['media:thumbnail']?.$?.url) {
      enclosure = { url: item['media:thumbnail'].$.url };
    }

    // Resolve content: prefer content:encoded, then content, then contentSnippet
    const content: string | null =
      (item['content:encoded'] as string | undefined) ??
      (item.content as string | undefined) ??
      (item.contentSnippet as string | undefined) ??
      null;

    // Resolve author/creator
    const creator: string | null =
      (item['dc:creator'] as string | undefined) ??
      (item.creator as string | undefined) ??
      ((item as unknown as Record<string, unknown>).author as string | undefined) ??
      null;

    return {
      title: (item.title ?? '').trim(),
      link: (item.link ?? item.guid ?? '').trim(),
      pubDate: item.pubDate ?? item.isoDate ?? null,
      content,
      creator,
      enclosure,
    };
  });

  // Filter out items without a usable URL
  const valid = items.filter((i) => i.link);
  console.log(`[rss-parser] Parsed ${valid.length} items from ${feedUrl}`);
  return valid;
}
