'use client';

import { useEffect, useRef } from 'react';

interface JobMapProps {
  className?: string;
}

export function JobMap({ className }: JobMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Kakao Maps API integration placeholder
    // Will be activated when NEXT_PUBLIC_KAKAO_MAP_KEY is configured
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!kakaoKey || !mapRef.current) return;

    // Load Kakao Maps SDK dynamically
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`;
    script.onload = () => {
      const kakao = (window as any).kakao;
      if (kakao?.maps) {
        kakao.maps.load(() => {
          const map = new kakao.maps.Map(mapRef.current, {
            center: new kakao.maps.LatLng(37.5665, 126.978),
            level: 8,
          });
          return map;
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div ref={mapRef} className={`rounded-xl border border-border bg-card ${className || 'h-[300px] w-full'}`}>
      {!process.env.NEXT_PUBLIC_KAKAO_MAP_KEY && (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          지도 보기 (카카오맵 API 키 설정 필요)
        </div>
      )}
    </div>
  );
}
