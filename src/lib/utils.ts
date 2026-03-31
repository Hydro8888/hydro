export function timeAgo(date: Date | string | null): string {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function countryLabel(code: string): string {
  const map: Record<string, string> = {
    global: '세계', us: '미국', japan: '일본', china: '중국',
  };
  return map[code] || code;
}

export function countryColor(code: string): string {
  const map: Record<string, string> = {
    global: 'bg-blue-100 text-blue-800',
    us: 'bg-red-100 text-red-800',
    japan: 'bg-pink-100 text-pink-800',
    china: 'bg-yellow-100 text-yellow-800',
  };
  return map[code] || 'bg-gray-100 text-gray-800';
}

export function categoryLabel(slug: string): string {
  const map: Record<string, string> = {
    politics: '정치', economy: '경제', market: '증시', business: '비즈니스',
    'ai-tech': 'AI·테크', semiconductor: '반도체', automotive: '자동차',
    energy: '에너지', society: '사회', culture: '문화', entertainment: '연예',
    sports: '스포츠', science: '과학', health: '건강', world: '세계',
    general: '일반', opinion: '오피니언', travel: '여행',
  };
  return map[slug] || slug;
}

export function buildSearchParams(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  });
  return sp.toString();
}

/**
 * Returns a default image URL for articles without photos.
 * Uses Unsplash source with category-specific keywords.
 * The article ID is used to get a consistent image per article.
 */
const categoryImageKeywords: Record<string, string> = {
  politics: 'government,politics,capitol',
  economy: 'economy,finance,money',
  market: 'stock-market,trading,wall-street',
  business: 'business,office,corporate',
  'ai-tech': 'artificial-intelligence,technology,computer',
  semiconductor: 'microchip,semiconductor,technology',
  automotive: 'car,automotive,vehicle',
  energy: 'energy,solar,power',
  society: 'city,people,community',
  culture: 'culture,art,museum',
  entertainment: 'entertainment,movie,celebrity',
  sports: 'sports,athlete,stadium',
  science: 'science,laboratory,research',
  health: 'health,medical,hospital',
  world: 'globe,world,international',
  general: 'newspaper,news,media',
};

export function getDefaultImage(category: string | null, articleId: number | string): string {
  const cat = category || 'general';
  const keywords = categoryImageKeywords[cat] || 'news,world';
  const id = typeof articleId === 'string' ? parseInt(articleId) || 0 : articleId;
  // Use article ID as sig to get consistent but varied images
  return `https://source.unsplash.com/800x600/?${keywords}&sig=${id}`;
}
