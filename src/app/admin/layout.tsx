import Link from 'next/link';
import AdminNav from '@/components/AdminNav';

const adminMenu = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/sources', label: '소스 관리' },
  { href: '/admin/articles', label: '기사 관리' },
  { href: '/admin/logs', label: '수집 로그' },
];

// The site Header / Footer / bottom tab bar are not rendered under /admin (see isAdminPath),
// so this bar is the only navigation here. Kept as a <div> (not <header>) on purpose.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Admin bar — same max-w-7xl + px-4 box as the content, so the logo and content align */}
      <div className="bg-surface-card border-b border-border py-3">
        {/* < sm: row 1 = brand + back link, row 2 = AdminNav (order + w-full).
            >= sm: order reset → brand · nav · (ml-auto) back link, as before. */}
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/admin" className="whitespace-nowrap font-bold text-lg text-accent">
            LiveNews Admin
          </Link>
          <div className="order-3 w-full sm:order-none sm:w-auto">
            <AdminNav items={adminMenu} />
          </div>
          <Link href="/" className="order-2 ml-auto whitespace-nowrap text-sm text-text-muted hover:text-text sm:order-none">
            사이트로 돌아가기
          </Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
