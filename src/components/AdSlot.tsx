import { cn } from '@/lib/utils';

interface AdSlotProps {
  size: 'banner' | 'sidebar' | 'native';
  className?: string;
}

// The four pixel values are IAB ad unit sizes (728x90 leaderboard, 300x250 medium rectangle),
// which the 4px spacing scale cannot express.
const SIZE_CONFIG = {
  banner: {
    width: 'w-full max-w-[728px]',
    height: 'h-[90px]',
    label: '배너 광고 (728x90)',
  },
  sidebar: {
    width: 'w-full max-w-[300px]',
    height: 'h-[250px]',
    label: '사이드바 광고 (300x250)',
  },
  native: {
    width: 'w-full',
    height: 'min-h-32',
    label: '네이티브 광고',
  },
} as const;

// Placeholder boxes look unfinished to end users — render slots only once
// real ad serving is wired up (flip NEXT_PUBLIC_ADS_ENABLED=true).
const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';

export default function AdSlot({ size, className }: AdSlotProps) {
  const config = SIZE_CONFIG[size];

  if (!ADS_ENABLED) return null;

  return (
    <div
      className={cn(config.width, config.height, 'mx-auto flex items-center justify-center rounded-card border border-dashed border-border', className)}
      role="complementary"
      aria-label={config.label}
      data-ad-slot={size}
    >
      <p className="text-caption text-text-muted">광고</p>
    </div>
  );
}
