import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';
import { getCategoryStyle, cn } from '@/lib/utils';

interface CategoryNavProps {
  activeCategory: string;
  country?: string;
}

export default function CategoryNav({ activeCategory, country }: CategoryNavProps) {
  function buildHref(slug: string) {
    const base = `/category/${slug}`;
    if (country) return `${base}?country=${country}`;
    return base;
  }

  return (
    <nav
      aria-label="카테고리"
      className="w-full overflow-x-auto scrollbar-none"
    >
      <ul className="flex min-w-max items-center gap-2 py-2">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.slug;
          const style = getCategoryStyle(cat.slug);

          return (
            <li key={cat.slug}>
              <Link
                href={buildHref(cat.slug)}
                className={cn(
                  'inline-flex items-center gap-1.5 border-l-2 px-3 py-1.5 text-body-md font-medium whitespace-nowrap rounded-badge transition-all',
                  isActive
                    ? `${style.border} ${style.text} ${style.bg} shadow-card`
                    : `border-l-transparent text-text-secondary hover:${style.text} hover:border-l-current bg-transparent hover:bg-surface-elevated`
                )}
              >
                <span aria-hidden="true">{cat.icon}</span>
                {cat.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
