'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Notification {
  id: string
  type: string
  priority: string
  title: string
  message: string
  actionUrl?: string
  read: boolean
  createdAt: string
}

const priorityColors: Record<string, string> = {
  URGENT: 'bg-red-500',
  IMPORTANT: 'bg-orange-500',
  NORMAL: 'bg-blue-500',
  RECOMMENDATION: 'bg-gray-400',
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  const loadNotifications = () => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotifications(data.data.notifications)
          setUnreadCount(data.data.unreadCount)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000) // 30초마다 갱신
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    loadNotifications()
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-lg border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b p-3">
              <h3 className="font-semibold">알림</h3>
              <span className="text-xs text-muted-foreground">{unreadCount}개 미읽음</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  알림이 없습니다
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 border-b p-3 cursor-pointer hover:bg-accent ${
                      !n.read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      if (!n.read) markAsRead(n.id)
                      if (n.actionUrl) window.location.href = n.actionUrl
                      setOpen(false)
                    }}
                  >
                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${priorityColors[n.priority] || 'bg-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.read ? 'font-medium' : ''}`}>{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
