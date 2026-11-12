import Link from 'next/link';
import { NUM } from '@/lib/ui';
import { formatWireTime, getDisplayTitle, toIsoDateTime } from '@/lib/utils';

interface Props {
  article: {
    id: number | string;
    titleKo: string | null;
    titleOriginal: string;
    publishedAt: Date | string | null;
    source: { sourceName: string };
    language?: string | null;
  };
  /** Ranking lists only. Without it the left column prints the wire time. */
  rank?: number;
}

/**
 * One row of a wire list. The left column is 48px in every row, so the titles start on one line:
 * 'HH:mm' sets on one line; 'MM.DD HH:mm' wraps at its space and 'YYYY.MM.DD' after the year,
 * each into two lines of five figures.
 *
 * Rendered on the server: it is imported by server pages only. The <wbr> makes the markup, not just
 * the text, depend on today's date, and suppressHydrationWarning covers text only — so do not import
 * this file from a client component.
 */
export default function NewsCardCompact({ article, rank }: Props) {
  const t = getDisplayTitle(article);
  const isoDate = toIsoDateTime(article.publishedAt);
  const wire = formatWireTime(article.publishedAt);
  const hasTime = !!isoDate && !!wire;
  const ranked = rank != null;
  const yearFirst = wire.length === 10; // 'YYYY.MM.DD' has no space to wrap at

  return (
    <Link
      href={`/article/${article.id}`}
      className="-mx-2 flex items-baseline gap-3 border-b border-border-muted px-2 py-3 transition-colors last:border-b-0 hover:bg-surface-elevated focus-visible:-outline-offset-2"
    >
      {ranked ? (
        <span className={`w-6 shrink-0 text-meta text-text-muted ${NUM}`}>{rank}</span>
      ) : hasTime ? (
        <time dateTime={isoDate} suppressHydrationWarning className="dateline w-12 shrink-0">
          {yearFirst ? (
            <>
              {wire.slice(0, 5)}
              <wbr />
              {wire.slice(5)}
            </>
          ) : (
            wire
          )}
        </time>
      ) : (
        <span aria-hidden="true" className="w-12 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <h4 lang={t.lang} className="text-body-md font-medium leading-5 text-text line-clamp-2">
          {t.text}
        </h4>
        <p className="mt-1 flex items-center gap-2 text-caption text-text-muted">
          <span className="truncate">{article.source.sourceName}</span>
          {ranked && hasTime && (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={isoDate} suppressHydrationWarning className="dateline shrink-0 whitespace-nowrap">
                {wire}
              </time>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
