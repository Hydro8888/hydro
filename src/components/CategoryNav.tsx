import Link from 'next/link';
import { CATEGORIES } from '@/lib/constants';

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

          return (
            <li key={cat.slug}>
              <Link
                href={buildHref(cat.slug)}
                className={`inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-all
                  ${
                    isActive
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600'
                  }`}
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
