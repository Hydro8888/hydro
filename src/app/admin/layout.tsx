import Link from 'next/link';

const adminMenu = [
  { href: '/admin', label: '대시보드' },
  { href: '/admin/sources', label: '소스 관리' },
  { href: '/admin/articles', label: '기사 관리' },
  { href: '/admin/logs', label: '수집 로그' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Admin Header */}
      <div className="bg-surface-card border-b border-border py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold text-lg text-accent">
              LiveNews Admin
            </Link>
            <nav className="flex flex-wrap gap-2 sm:gap-4">
              {adminMenu.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-text-secondary hover:text-text transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link href="/" className="text-sm text-text-muted hover:text-text">
            사이트로 돌아가기
          </Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
