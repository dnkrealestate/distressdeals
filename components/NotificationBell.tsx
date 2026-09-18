'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Check, TrendingUp, Home, CalendarClock, MessageSquare, Loader2, ListTodo } from 'lucide-react'
import { notifAPI } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/authStore'
import { timeAgo, cn } from '@/lib/utils'

interface Notification {
  _id: string; type: string; title: string; body: string
  data?: Record<string, any>; isRead: boolean; createdAt: string
}

const TYPE_ICON: Record<string, any> = {
  new_lead: TrendingUp, lead_update: TrendingUp,
  lead_delete_requested: TrendingUp, lead_delete_approved: TrendingUp, lead_delete_rejected: TrendingUp,
  property_approved: Home, property_rejected: Home, property_sold: Home, property_reopened: Home,
  property_reported: Home, new_property_match: Home,
  meeting_scheduled: CalendarClock, meeting_reminder: CalendarClock,
  message_received: MessageSquare,
  task_assigned: ListTodo,
}

// Where a notification's "type" should take the user, depending on their
// role — an agent's "new_lead" goes to the CRM, a buyer's "new_lead"
// (their own enquiry confirmation) goes to their own leads page, etc.
// Wherever the target page supports deep-linking to the exact item (chat
// room, lead), we go straight there instead of dropping the user on the
// list — the same "click it, land on it" behaviour the room list itself uses.
function destinationFor(type: string, role?: string, data?: Record<string, any>): string | null {
  if (type === 'new_lead' || type === 'lead_update' || type.startsWith('lead_delete_')) {
    const leadId = data?.leadId
    if (role === 'buyer') return '/buyer/leads'
    if (role === 'seller') return '/seller/leads'
    return leadId ? `/admin/leads?lead=${leadId}` : '/admin/leads'
  }
  if (type === 'task_assigned') {
    const leadId = data?.leadId
    return leadId ? `/admin/leads?lead=${leadId}` : '/admin/leads'
  }
  if (type.startsWith('property_') || type === 'new_property_match') {
    const propertyId = data?.propertyId
    if (role === 'seller') return '/seller/listings'
    if (role === 'buyer') return null
    return propertyId ? `/admin/properties/${propertyId}` : '/admin/properties'
  }
  if (type === 'meeting_scheduled' || type === 'meeting_reminder') {
    return role === 'buyer' ? '/buyer/tours' : role === 'seller' ? null : '/admin/meetings'
  }
  if (type === 'message_received') {
    const roomId = data?.roomId
    const base = role === 'seller' ? '/seller/messages' : role === 'buyer' ? null : '/admin/messages'
    return base && roomId ? `${base}?room=${roomId}` : base
  }
  return null
}

// Reusable in two visual contexts: the public Navbar (light trigger button,
// dropdown opens downward) and a dashboard sidebar footer (dropdown opens
// upward so it doesn't get clipped by the viewport at the bottom of a
// narrow sidebar).
export default function NotificationBell({ variant = 'navbar' }: { variant?: 'navbar' | 'sidebar' }) {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const refreshCount = useCallback(() => {
    notifAPI.getCount().then(r => { if (r.data.success) setUnreadCount(r.data.data.count ?? r.data.data) }).catch(() => {})
  }, [])

  // Ask once, up front, so a desktop notification can actually fire later —
  // browsers won't prompt again once the user has answered either way.
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission().catch(() => {})
    }
  }, [])

  useEffect(() => {
    refreshCount()
    const socket = getSocket()
    const onNotification = (n: Notification) => {
      setNotifications(prev => [n, ...prev])
      setUnreadCount(c => c + 1)

      // Desktop push — only while the tab isn't the thing the user's looking
      // at; if they're already in the app the in-app bell/toast is enough.
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted' && document.hidden) {
        const desktopNotif = new window.Notification(n.title, { body: n.body, tag: n._id })
        desktopNotif.onclick = () => {
          window.focus()
          const dest = destinationFor(n.type, user?.role, n.data)
          if (dest) router.push(dest)
        }
      }
    }
    socket.on('notification', onNotification)
    return () => { socket.off('notification', onNotification) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCount, user?.role])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    notifAPI.getAll({ limit: 15 })
      .then(r => { if (r.data.success) setNotifications(r.data.data.data || r.data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const openNotification = async (n: Notification) => {
    if (!n.isRead) {
      setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, isRead: true } : x))
      setUnreadCount(c => Math.max(0, c - 1))
      notifAPI.markRead(n._id).catch(() => {})
    }
    const dest = destinationFor(n.type, user?.role, n.data)
    setOpen(false)
    if (dest) router.push(dest)
  }

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
    try { await notifAPI.markAllRead() } catch { /* local state already optimistic */ }
  }

  const isSidebar = variant === 'sidebar'

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={isSidebar ? 'sidebar-link w-full justify-between' : 'relative btn-ghost btn-sm p-2.5'}
        aria-label="Notifications"
      >
        {isSidebar ? (
          <>
            <span className="flex items-center gap-2"><Bell size={15} /> Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold text-white rounded-full px-1.5 py-0.5" style={{ background: 'var(--grad)' }}>{unreadCount}</span>
            )}
          </>
        ) : (
          <>
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center" style={{ background: 'var(--grad)' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: isSidebar ? 8 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isSidebar ? 8 : -8 }}
            transition={{ duration: 0.16 }}
            className={cn('absolute z-50 w-80 rounded-2xl overflow-hidden shadow-2xl', isSidebar ? 'bottom-full left-0 mb-2' : 'right-0 top-full mt-2')}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between p-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Notifications</p>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--teal)' }}>
                  <Check size={11} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 flex justify-center"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--teal)' }} /></div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={22} style={{ color: 'var(--text-muted)', opacity: 0.4 }} className="mx-auto mb-2" />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => {
                  const Icon = TYPE_ICON[n.type] || Bell
                  return (
                    <button
                      key={n._id}
                      onClick={() => openNotification(n)}
                      className="w-full text-left flex items-start gap-3 p-3.5 transition-colors"
                      style={{ background: n.isRead ? 'transparent' : 'rgba(203,1,1,0.05)', borderBottom: '1px solid var(--border-soft)' }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
                        <Icon size={14} style={{ color: 'var(--teal)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{n.title}</p>
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{n.body}</p>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: 'var(--teal)' }} />}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
