'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            3
          </span>
        </Button>

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
