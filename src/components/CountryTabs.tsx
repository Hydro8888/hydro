import Link from 'next/link';
import { COUNTRIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

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

// 40px tabs. The current tab is accent text on a 2px accent line that sits on the row's hairline.
// The row scrolls sideways and would clip an outer focus outline, so it is drawn inside.
const TAB =
  'inline-flex h-10 items-center whitespace-nowrap border-b-2 px-4 text-body-md font-medium transition-colors focus-visible:-outline-offset-2';
const TAB_IDLE = 'border-transparent text-text-secondary hover:text-text';
const TAB_CURRENT = 'border-accent text-accent';

export default function CountryTabs({ activeCountry, basePath }: CountryTabsProps) {
  const pattern = basePath ?? '';

  return (
    <nav aria-label="국가별 뉴스" className="w-full overflow-x-auto scrollbar-none">
      <ul className="flex min-w-max items-center border-b border-border-muted">
        {COUNTRIES.map((c) => {
          const href = pattern ? buildHref(pattern, c.code) : c.code === 'all' ? '/' : `/?country=${c.code}`;
          const isActive = activeCountry === c.code;

          return (
            <li key={c.code} className="-mb-px">
              <Link href={href} aria-current={isActive ? 'page' : undefined} className={cn(TAB, isActive ? TAB_CURRENT : TAB_IDLE)}>
                {c.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
