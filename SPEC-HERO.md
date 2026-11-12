# SPEC-HERO: 주요 헤드라인 좌측 빈 공간에 속보 리스트 추가

## 문제
히어로 카드(좌측 2/3)가 우측 서브히어로 2개보다 짧아 좌측 하단에 큰 빈 공간 발생.

## 해결
히어로 카드 아래 빈 공간에 속보 기사 리스트(NewsCardCompact 활용)를 배치.

## 레이아웃
```
┌─────────────────────┬────────────┐
│ Hero (NewsCardLarge) │ Sub-hero 1 │
│                      │            │
├─────────────────────│ Sub-hero 2 │
│ 🔴 속보 기사 리스트   │            │
│  · 기사1 (compact)   │            │
│  · 기사2 (compact)   │            │
│  · 기사3 (compact)   │            │
└─────────────────────┴────────────┘
```

## 구현
- page.tsx 히어로 섹션에서 좌측 `lg:col-span-2` 영역을 flex-col로 변경
- NewsCardLarge 아래에 속보 리스트 카드 추가
- `breaking` 데이터를 활용 (이미 가져오고 있음)
- NewsCardCompact 재사용
- 카드 스타일: bg-surface-card rounded-card border border-border-muted p-4
