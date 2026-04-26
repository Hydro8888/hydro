export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COUNTRY_SUBCATEGORIES } from '@/lib/constants';
import { getCountryArticles } from '@/lib/queries';
import NewsCard from '@/components/NewsCard';
import NewsCardLarge from '@/components/NewsCardLarge';
import Pagination from '@/components/Pagination';
import NewsletterBanner from '@/components/NewsletterBanner';
import AdSlot from '@/components/AdSlot';

// Route-param → Prisma country code mapping
const COUNTRY_CONFIG: Record<string, { dbCode: string; label: string; emoji: string }> = {
  world: { dbCode: 'global', label: '세계', emoji: '🌍' },
  us:    { dbCode: 'us',     label: '미국', emoji: '🇺🇸' },
  japan: { dbCode: 'japan',  label: '일본', emoji: '🇯🇵' },
  china: { dbCode: 'china',  label: '중국', emoji: '🇨🇳' },
};

const VALID_COUNTRIES = Object.keys(COUNTRY_CONFIG);

export function generateStaticParams() {
  return VALID_COUNTRIES.map((country) => ({ country }));
}

export async function generateMetadata({ params }: { params: { country: string } }) {
  const config = COUNTRY_CONFIG[params.country];
  if (!config) return { title: 'Not Found - LiveNews' };
  return {
    title: `${config.label} 뉴스 - LiveNews`,
    description: `${config.label} 주요 뉴스를 실시간으로 확인하세요`,
  };
}

export default async function CountryPage({
  params,
  searchParams,
}: {
  params: { country: string };
  searchParams: { page?: string };
}) {
  const config = COUNTRY_CONFIG[params.country];
  if (!config) notFound();

  const page = parseInt(searchParams.page || '1');
  const { articles, total, totalPages } = await getCountryArticles(config.dbCode, page);
  const headlines = articles.slice(0, 3);
  const rest = articles.slice(3);
  const subcategories = COUNTRY_SUBCATEGORIES[config.dbCode] || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">{config.emoji}</span>
        <h1 className="text-headline-lg text-text">{config.label} 뉴스</h1>
        <span className="text-caption text-text-muted bg-surface-elevated px-2.5 py-1 rounded-badge">
          {total}개
        </span>
      </div>

      {/* Subcategory pills */}
      {subcategories.length > 0 && (
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {subcategories.map((sub) => (
            <span
              key={sub.slug}
              className="px-3.5 py-1.5 rounded-pill text-body-md border border-border text-text-secondary hover:border-accent hover:text-accent cursor-pointer whitespace-nowrap transition-colors"
            >
              {sub.label}
            </span>
          ))}
        </div>
      )}

      {/* Headlines — asymmetric hero layout */}
      {headlines.length > 0 && (
        <section className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {headlines.map((article) => (
              <NewsCardLarge key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* Article grid */}
      {rest.length > 0 && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((article, idx) => (
              <React.Fragment key={article.id}>
                <NewsCard article={article} />
                {(idx + 1) % 4 === 0 && idx < rest.length - 1 && (
                  <AdSlot size="native" className="md:col-span-2 lg:col-span-3" />
                )}
              </React.Fragment>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {articles.length === 0 && (
        <div className="text-center py-24">
          <p className="text-text-secondary text-headline-sm">
            {config.label} 뉴스를 불러오는 중입니다
          </p>
          <p className="text-text-muted text-body-md mt-2">잠시 후 새로고침해 주세요</p>
          <Link
            href={`/${params.country}`}
            className="mt-4 inline-block px-4 py-2 bg-accent text-white rounded-card text-body-md font-semibold hover:bg-accent/90 transition-colors"
          >
            새로고침
          </Link>
        </div>
      )}

      {/* Newsletter Banner */}
      <section className="mt-10 mb-6">
        <NewsletterBanner />
      </section>

      <Pagination currentPage={page} totalPages={totalPages} basePath={`/${params.country}`} />
    </div>
  );
}
