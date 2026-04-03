// ---------------------------------------------------------------------------
// Shared types derived from Prisma schema
// ---------------------------------------------------------------------------

export interface Source {
  id: number;
  sourceName: string;
  sourceType: string;
  country: string;
  language: string;
  baseUrl: string;
  feedUrl: string | null;
  crawlInterval: number;
  isEnabled: boolean;
  robotsCheckedAt: Date | null;
  createdAt: Date;
}

export interface Article {
  id: number | string;
  sourceId?: number;
  source: Pick<Source, 'sourceName'>;
  originalUrl: string;
  titleOriginal: string;
  titleKo: string | null;
  summaryKo: string | null;
  contentOriginal?: string | null;
  contentKo?: string | null;
  publishedAt: string | Date | null;
  fetchedAt?: string | Date;
  language?: string;
  country: string;
  categoryPrimary: string | null;
  categorySecondary?: string | null;
  imageUrl: string | null;
  author?: string | null;
  tags?: string[];
  clusterId?: number | null;
  isActive?: boolean;
  viewCount?: number;
  createdAt?: string | Date;
}

export interface TickerArticle {
  id: string;
  titleKo: string | null;
  titleOriginal: string;
}

export interface TrendingKeyword {
  keyword: string;
  count: number;
}
