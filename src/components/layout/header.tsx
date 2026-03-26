'use client'

import { useState } from 'react'
import { Select } from '@/components/ui/select'
import { NotificationBell } from '@/components/common/notification-bell'
import { UserRoleLabel } from '@/lib/constants/enums'
import type { UserRole } from '@/lib/constants/enums'
import { MOCK_USERS } from '@/lib/auth'

export function Header() {
  const [currentRole, setCurrentRole] = useState<UserRole>('OWNER')
  const currentUser = MOCK_USERS.find(u => u.role === currentRole)

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div />
      <div className="flex items-center gap-4">
        <NotificationBell />

        <div className="flex items-center gap-2">
          <Select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            className="w-36 h-9 text-xs"
          >
            {Object.entries(UserRoleLabel).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <span className="text-sm text-muted-foreground">
            {currentUser?.name}
          </span>
        </div>
      </div>
    </header>
  )
}
