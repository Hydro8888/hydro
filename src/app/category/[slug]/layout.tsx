import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getCategoryArticles } from '@/lib/queries';
import {
  LIST_QUERY_HEADER,
  isKnownCategorySlug,
  pageFromQuery,
  pageHref,
  resolvePageRequest,
} from '@/lib/routing';

// Both checks live in the layout on purpose: notFound()/redirect() here run before the sibling
// loading.tsx boundary starts streaming, so unknown categories get a real HTTP 404 and an
// out-of-range ?page= a real 307 (in page.tsx / generateMetadata they would arrive after a 200).
// The query arrives via the middleware header (layouts get no searchParams); page.tsx keeps
// the page check for client-side navigations, where this layout is not re-run.
export default async function CategoryLayout({
  params,
  children,
}: {
  params: { slug: string };
  children: React.ReactNode;
}) {
  if (!isKnownCategorySlug(params.slug)) notFound();

  const page = pageFromQuery(headers().get(LIST_QUERY_HEADER));
  if (page > 1) {
    const { totalPages } = await getCategoryArticles(params.slug, page);
    const resolved = resolvePageRequest(page, totalPages);
    if (resolved.kind === 'redirect') redirect(pageHref(`/category/${params.slug}`, resolved.page));
  }
  return children;
}
