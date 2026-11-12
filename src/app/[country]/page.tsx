export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { COUNTRY_SUBCATEGORIES } from '@/lib/constants';
import { getCountryArticles } from '@/lib/queries';
import { BTN_SECONDARY, CONTAINER } from '@/lib/ui';
import { cn, parsePage } from '@/lib/utils';
import { pageHref, resolvePageRequest } from '@/lib/routing';
import { NEWSLETTER_ENABLED } from '@/lib/newsletter';
import ArticleListing from '@/components/ArticleListing';
import ChipNav from '@/components/ChipNav';
import EmptyState from '@/components/EmptyState';
import PageHeading from '@/components/PageHeading';
import Pagination from '@/components/Pagination';
import NewsletterBanner from '@/components/NewsletterBanner';

// Route-param → Prisma country code mapping
const COUNTRY_CONFIG: Partial<Record<string, { dbCode: string; label: string }>> = {
  world: { dbCode: 'global', label: '세계' },
  us:    { dbCode: 'us',     label: '미국' },
  japan: { dbCode: 'japan',  label: '일본' },
  china: { dbCode: 'china',  label: '중국' },
};

const VALID_COUNTRIES = Object.keys(COUNTRY_CONFIG);

export function generateStaticParams() {
  return VALID_COUNTRIES.map((country) => ({ country }));
}

function getConfig(country: string) {
  return Object.prototype.hasOwnProperty.call(COUNTRY_CONFIG, country) ? COUNTRY_CONFIG[country] : undefined;
}

export async function generateMetadata({ params }: { params: { country: string } }) {
  const config = getConfig(params.country);
  // Unknown → notFound() here too, so the RSC head carries not-found.tsx's title after
  // hydration (returning {} falls back to the root default title). No loading.tsx → real 404.
  if (!config) notFound();
  return {
    title: `${config.label} 뉴스`,
    description: `${config.label} 주요 뉴스를 한국어로 번역해 전합니다`,
  };
}

export default async function CountryPage({
  params,
  searchParams,
}: {
  params: { country: string };
  searchParams: { page?: string | string[] };
}) {
  const config = getConfig(params.country);
  if (!config) notFound();

  const page = parsePage(searchParams.page);
  // Throws on a DB error → error.tsx (no loading boundary here, so a real HTTP 500)
  const { articles, total, totalPages } = await getCountryArticles(config.dbCode, page);

  const resolved = resolvePageRequest(page, totalPages);
  if (resolved.kind === 'redirect') redirect(pageHref(`/${params.country}`, resolved.page));

  const subcategories = COUNTRY_SUBCATEGORIES[config.dbCode] || [];

  return (
    <div className={cn(CONTAINER, 'py-8')}>
      <PageHeading title={`${config.label} 뉴스`} count={total} />

      {subcategories.length > 0 && <ChipNav label="세부 분야" items={subcategories} />}

      <ArticleListing articles={articles} ads />

      {/* The query succeeded and there is genuinely nothing yet */}
      {articles.length === 0 && (
        <EmptyState title={`${config.label} 뉴스가 아직 없습니다`} detail="새 기사가 수집되면 이곳에 표시됩니다">
          <Link href="/breaking" className={BTN_SECONDARY}>
            전체 속보 보기
          </Link>
        </EmptyState>
      )}

      {/* Pagination directly after the list — users shouldn't scroll past a
          promo banner to reach page 2 */}
      <Pagination currentPage={page} totalPages={totalPages} basePath={`/${params.country}`} />

      {NEWSLETTER_ENABLED && articles.length > 0 && (
        <section className="mt-12">
          <NewsletterBanner />
        </section>
      )}
    </div>
  );
}
