interface AdSlotProps {
  size: 'banner' | 'sidebar' | 'native';
  className?: string;
}

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
    height: 'min-h-[120px]',
    label: '네이티브 광고',
  },
} as const;

export default function AdSlot({ size, className = '' }: AdSlotProps) {
  const config = SIZE_CONFIG[size];

  return (
    <div
      className={`${config.width} ${config.height} mx-auto
        flex items-center justify-center
        border border-dashed border-border-muted rounded-card
        bg-surface-card/50
        ${className}`}
      role="complementary"
      aria-label={config.label}
      data-ad-slot={size}
    >
      <div className="text-center">
        <p className="text-caption text-text-muted">{config.label}</p>
        <p className="text-overline text-text-muted mt-0.5">광고 영역</p>
      </div>
    </div>
  );
}
