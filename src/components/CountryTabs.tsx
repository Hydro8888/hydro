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
      <ul className="flex min-w-max items-center gap-0 border-b border-border-muted">
        {COUNTRIES.map((c) => {
          const href = pattern ? buildHref(pattern, c.code) : c.code === 'all' ? '/' : `/?country=${c.code}`;
          const isActive = activeCountry === c.code;

          return (
            <li key={c.code}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`relative inline-flex items-center gap-1 px-4 py-3 text-body-md font-medium whitespace-nowrap transition-colors
                  ${
                    isActive
                      ? 'text-accent after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent'
                      : 'text-text-secondary hover:text-text'
                  }`}
              >
                {c.label}
                {c.code !== 'all' && (
                  <span className="hidden sm:inline text-caption text-text-muted font-normal">
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
