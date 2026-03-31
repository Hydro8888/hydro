export const COUNTRIES = [
  { code: 'all', label: '전체', labelEn: 'All' },
  { code: 'global', label: '세계', labelEn: 'World' },
  { code: 'us', label: '미국', labelEn: 'US' },
  { code: 'japan', label: '일본', labelEn: 'Japan' },
  { code: 'china', label: '중국', labelEn: 'China' },
] as const;

export const COUNTRY_SUBCATEGORIES: Record<string, Array<{ slug: string; label: string }>> = {
  global: [
    { slug: 'international-politics', label: '국제정치' },
    { slug: 'war-diplomacy', label: '전쟁/외교' },
    { slug: 'global-economy', label: '글로벌 경제' },
    { slug: 'climate', label: '기후/환경' },
    { slug: 'international-society', label: '국제사회' },
  ],
  us: [
    { slug: 'politics', label: '정치' },
    { slug: 'business', label: '비즈니스' },
    { slug: 'market', label: '증시' },
    { slug: 'bigtech', label: '빅테크' },
    { slug: 'society', label: '사회' },
    { slug: 'sports', label: '스포츠' },
  ],
  japan: [
    { slug: 'politics', label: '정치' },
    { slug: 'economy', label: '경제' },
    { slug: 'industry', label: '산업' },
    { slug: 'semiconductor', label: '반도체' },
    { slug: 'automotive', label: '자동차' },
    { slug: 'society', label: '사회' },
    { slug: 'entertainment', label: '엔터' },
  ],
  china: [
    { slug: 'policy', label: '정책' },
    { slug: 'economy', label: '경제' },
    { slug: 'industry', label: '산업' },
    { slug: 'technology', label: '기술' },
    { slug: 'trade', label: '무역' },
    { slug: 'society', label: '사회' },
    { slug: 'international', label: '국제관계' },
  ],
};

export const CATEGORIES = [
  { slug: 'politics', label: '정치', icon: '🏛' },
  { slug: 'economy', label: '경제', icon: '📊' },
  { slug: 'market', label: '증시', icon: '📈' },
  { slug: 'business', label: '비즈니스', icon: '💼' },
  { slug: 'ai-tech', label: 'AI·테크', icon: '🤖' },
  { slug: 'semiconductor', label: '반도체', icon: '🔬' },
  { slug: 'automotive', label: '자동차', icon: '🚗' },
  { slug: 'energy', label: '에너지', icon: '⚡' },
  { slug: 'society', label: '사회', icon: '👥' },
  { slug: 'culture', label: '문화', icon: '🎭' },
  { slug: 'entertainment', label: '연예', icon: '🎬' },
  { slug: 'sports', label: '스포츠', icon: '⚽' },
  { slug: 'science', label: '과학', icon: '🔭' },
  { slug: 'health', label: '건강', icon: '❤' },
  { slug: 'world', label: '세계', icon: '🌍' },
  { slug: 'general', label: '일반', icon: '📰' },
] as const;

export const MAIN_MENU = [
  { href: '/', label: '홈' },
  { href: '/breaking', label: '속보' },
  { href: '/world', label: '세계' },
  { href: '/us', label: '미국' },
  { href: '/japan', label: '일본' },
  { href: '/china', label: '중국' },
  { href: '/category/economy', label: '경제' },
  { href: '/category/market', label: '증시' },
  { href: '/category/ai-tech', label: 'AI·테크' },
  { href: '/category/semiconductor', label: '반도체' },
  { href: '/category/sports', label: '스포츠' },
  { href: '/search', label: '검색' },
  { href: '/ranking', label: '랭킹' },
] as const;

export const ITEMS_PER_PAGE = 20;
