import Link from 'next/link';
import { CHIP, CHIP_CURRENT } from '@/lib/ui';
import { cn } from '@/lib/utils';

interface ChipNavProps {
  /** Accessible name of the row. */
  label: string;
  items: ReadonlyArray<{ slug: string; label: string }>;
  /** Slug of the category being shown, if any. */
  current?: string;
}

// A row of category links that scrolls sideways on a narrow screen. The scrolling box would clip
// an outer focus outline, so it is drawn inside the chip (UNSLOP-AUDIT §7-19).
export default function ChipNav({ label, items, current }: ChipNavProps) {
  return (
    <nav aria-label={label} className="mb-8 flex gap-2 overflow-x-auto scrollbar-hide">
      {items.map((item) => {
        const active = item.slug === current;
        return (
          <Link
            key={item.slug}
            href={`/category/${item.slug}`}
            aria-current={active ? 'page' : undefined}
            className={cn(active ? CHIP_CURRENT : CHIP, 'focus-visible:-outline-offset-2')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
