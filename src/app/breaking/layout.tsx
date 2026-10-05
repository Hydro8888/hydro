import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getBreakingArticles } from '@/lib/queries';
import { LIST_QUERY_HEADER, pageFromQuery, pageHref, resolvePageRequest } from '@/lib/routing';

// Out-of-range ?page= is resolved HERE, above breaking/loading.tsx: a redirect thrown in the
// page would be streamed (200 + meta refresh + a second full page load); from the layout it is
// a real 307. The query arrives via the middleware header (layouts get no searchParams).
// page.tsx keeps the same check for client-side navigations, where this layout is not re-run.
export default async function BreakingLayout({ children }: { children: React.ReactNode }) {
  const page = pageFromQuery(headers().get(LIST_QUERY_HEADER));
  if (page > 1) {
    const { totalPages } = await getBreakingArticles(page);
    const resolved = resolvePageRequest(page, totalPages);
    if (resolved.kind === 'redirect') redirect(pageHref('/breaking', resolved.page));
  }
  return children;
}
