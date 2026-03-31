import { countryColor } from '@/lib/utils';

interface SourceBadgeProps {
  sourceName: string;
  country: string;
}

export default function SourceBadge({ sourceName, country }: SourceBadgeProps) {
  const colorClass = countryColor(country);

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium leading-none ${colorClass}`}
    >
      {sourceName}
    </span>
  );
}
