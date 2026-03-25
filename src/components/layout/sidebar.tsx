'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Briefcase,
  Search,
  Link2,
  ListTodo,
  CheckSquare,
  UserCheck,
  Activity,
  BarChart3,
  History,
} from 'lucide-react'

const navigation = [
  { name: '대시보드', href: '/', icon: LayoutDashboard },
  { name: '서비스 자산', href: '/services', icon: Briefcase },
  { name: '채널 탐색', href: '/channels', icon: Search },
  { name: '채널 연결', href: '/channels/connections', icon: Link2 },
  { name: '작업 센터', href: '/tasks', icon: ListTodo },
  { name: '승인 센터', href: '/approvals', icon: CheckSquare },
  { name: '반자동 작업', href: '/assisted', icon: UserCheck },
  { name: '운영 센터', href: '/operations', icon: Activity },
  { name: '보고서', href: '/reports', icon: BarChart3 },
  { name: '감사 이력', href: '/audit', icon: History },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-lg font-bold text-primary">Hydro Marketing</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <Link
          href="/onboarding"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + 새 서비스 등록
        </Link>
      </div>
    </div>
  )
}
