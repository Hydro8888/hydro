import Link from 'next/link';
import { COUNTRIES } from '@/lib/constants';

interface CountryTabsProps {
  activeCountry: string;
  /** URL pattern. Use '[country]' as placeholder. Defaults to '/?country=[country]' */
  basePath?: string;
}

function buildHref(pattern: string, code: string): string {
  if (pattern.includes('[country]')) {
    return pattern.replace('[country]', code);
  }
  // default: home with query param; 'all' means no filter
  if (code === 'all') return '/';
  return `/?country=${code}`;
}

export default function CountryTabs({ activeCountry, basePath }: CountryTabsProps) {
  const pattern = basePath ?? '';

  return (
    <nav
      aria-label="국가별 뉴스"
      className="w-full overflow-x-auto scrollbar-none"
    >
      <ul className="flex min-w-max items-center gap-0 border-b border-gray-200">
        {COUNTRIES.map((c) => {
          const href = pattern ? buildHref(pattern, c.code) : c.code === 'all' ? '/' : `/?country=${c.code}`;
          const isActive = activeCountry === c.code;

          return (
            <li key={c.code}>
              <Link
                href={href}
                className={`relative inline-flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                  ${
                    isActive
                      ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
              >
                {c.label}
                {c.code !== 'all' && (
                  <span className="hidden sm:inline text-xs text-gray-400 font-normal">
                    ({c.labelEn})
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
