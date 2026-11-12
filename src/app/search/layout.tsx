// search/page.tsx is a client component, so its <title> is declared here
// (rendered through the root template → '뉴스 검색 | LiveNews').
export const metadata = { title: '뉴스 검색' };

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
