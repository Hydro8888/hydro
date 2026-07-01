import Link from 'next/link';
import { timeAgo } from '@/lib/utils';

interface Props {
  article: {
    id: number | string;
    titleKo: string | null;
    titleOriginal: string;
    publishedAt: Date | string | null;
    source: { sourceName: string };
  };
  rank?: number;
}

export default function NewsCardCompact({ article, rank }: Props) {
  const title = article.titleKo || article.titleOriginal;
  return (
    <Link
      href={`/article/${article.id}`}
      className="group flex items-start gap-3 py-2.5 border-b border-border-muted last:border-b-0 hover:bg-surface-elevated/50 transition-colors px-1 -mx-1 rounded"
    >
      {rank != null && (
        <span className="text-headline-sm text-text-muted tabular-nums w-5 shrink-0 pt-0.5">
          {rank}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-body-md text-text group-hover:text-accent transition-colors line-clamp-2 font-medium leading-snug">
          {title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-caption text-text-muted">
          <span>{article.source.sourceName}</span>
          <span>{timeAgo(article.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
