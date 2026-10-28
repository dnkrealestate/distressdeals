'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, Check, Trash2, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '@/components/layouts/Navbar'
import Footer from '@/components/layouts/Footer'
import { notifAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { timeAgo } from '@/lib/utils'
import { TYPE_ICON, destinationFor, normalizeType, type Notification } from '@/components/NotificationBell'

// The full notification list for any signed-in person (buyers, sellers, staff): all / unread, grouped by day, with
// Mark all read and Clear (read ones or everything), and a delete on each one.
const PAGE = 30

export default function NotificationsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [items, setItems] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const load = useCallback(async (p: number, f: 'all' | 'unread') => {
    setLoading(true)
    try {
      const r = await notifAPI.getAll({ page: p, limit: PAGE, ...(f === 'unread' ? { unread: true } : {}) })
      const d = r.data.data
      setItems(prev => (p === 1 ? d.data : [...prev, ...d.data]))
      setTotal(d.total)
    } catch { toast.error('Could not load notifications') } finally { setLoading(false) }
  }, [])

  useEffect(() => { if (isAuthenticated) { setPage(1); load(1, filter) } }, [isAuthenticated, filter, load])

  const unread = items.filter(n => !n.isRead).length
  const groups = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today.getTime() - 86_400_000)
    const g: Record<string, Notification[]> = { Today: [], Yesterday: [], Earlier: [] }
    for (const n of items) { const t = new Date(n.createdAt); g[t >= today ? 'Today' : t >= yesterday ? 'Yesterday' : 'Earlier'].push(n) }
    return Object.entries(g).filter(([, v]) => v.length)
  }, [items])

  const open = async (n: Notification) => {
    if (!n.isRead) { setItems(xs => xs.map(x => x._id === n._id ? { ...x, isRead: true } : x)); notifAPI.markRead(n._id).catch(() => {}) }
    const dest = destinationFor(n.type, user?.role, n.data)
    if (dest) router.push(dest)
  }
  const markAll = async () => {
    setBusy(true)
    try { await notifAPI.markAllRead(); setItems(xs => xs.map(x => ({ ...x, isRead: true }))); if (filter === 'unread') load(1, 'unread') } finally { setBusy(false) }
  }
  const clear = async (onlyRead: boolean) => {
    setBusy(true); setConfirmClear(false)
    try { await notifAPI.clear(onlyRead); toast.success(onlyRead ? 'Read notifications cleared' : 'All notifications cleared'); setPage(1); load(1, filter) } finally { setBusy(false) }
  }
  const remove = async (n: Notification) => {
    setItems(xs => xs.filter(x => x._id !== n._id)); setTotal(t => Math.max(0, t - 1))
    notifAPI.remove(n._id).catch(() => toast.error('Could not delete'))
  }

  return (
    <div className="page">
      <Navbar />
      <main className="wrap max-w-3xl py-10">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="heading-md">Notifications</h1>
            <p className="muted mt-1">{total ? `${total.toLocaleString()} notification${total === 1 ? '' : 's'}` : 'Messages, leads, listing updates and new projects for you.'}</p>
          </div>
          {isAuthenticated && items.length > 0 && (
            <div className="flex items-center gap-2 relative">
              <button onClick={markAll} disabled={busy || unread === 0} className="btn-ghost btn-sm gap-1.5 disabled:opacity-40"><Check size={14} /> Mark all read</button>
              <button onClick={() => setConfirmClear(v => !v)} disabled={busy} className="btn-ghost btn-sm gap-1.5" style={{ color: '#E11D48' }}><Trash2 size={14} /> Clear</button>
              {confirmClear && (
                <div className="absolute right-0 top-full mt-2 z-20 w-56 rounded-xl shadow-xl p-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <button onClick={() => clear(true)} className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-[var(--bg-alt)]" style={{ color: 'var(--text)' }}>Clear read notifications</button>
                  <button onClick={() => clear(false)} className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-[var(--bg-alt)]" style={{ color: '#E11D48' }}>Clear all notifications</button>
                </div>
              )}
            </div>
          )}
        </div>

        {!isAuthenticated ? (
          <div className="card p-10 text-center">
            <Bell size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="mb-4" style={{ color: 'var(--text-mid)' }}>Sign in to see your notifications.</p>
            <Link href="/auth/login?redirect=/notifications" className="btn-primary btn-sm">Sign in</Link>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-5">
              {(['all', 'unread'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all"
                  style={{ borderColor: filter === f ? 'var(--teal)' : 'var(--border)', background: filter === f ? 'rgba(203,1,1,0.10)' : 'transparent', color: filter === f ? 'var(--teal)' : 'var(--text-muted)' }}>
                  {f === 'all' ? 'All' : `Unread${filter === 'all' && unread ? ` (${unread})` : ''}`}
                </button>
              ))}
            </div>

            {loading && items.length === 0 ? (
              <div className="py-16 flex justify-center"><Loader2 className="animate-spin" style={{ color: 'var(--teal)' }} /></div>
            ) : items.length === 0 ? (
              <div className="card p-10 text-center">
                <Bell size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                <p style={{ color: 'var(--text-mid)' }}>{filter === 'unread' ? 'All caught up — no unread notifications.' : 'No notifications yet.'}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map(([title, list]) => (
                  <section key={title}>
                    <h2 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{title}</h2>
                    <div className="space-y-2">
                      {list.map(n => {
                        const Icon = TYPE_ICON[normalizeType(n.type)] || Bell
                        return (
                          <div key={n._id} className="group flex items-start gap-3 p-4 rounded-2xl transition-colors"
                            style={{ background: n.isRead ? 'var(--surface)' : 'rgba(203,1,1,0.05)', border: `1px solid ${n.isRead ? 'var(--border-soft)' : 'rgba(203,1,1,0.22)'}` }}>
                            <button onClick={() => open(n)} className="flex items-start gap-3 flex-1 min-w-0 text-left">
                              <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)' }}>
                                <Icon size={18} style={{ color: 'var(--teal)' }} />
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="flex items-center gap-2">
                                  <span className="text-sm truncate" style={{ color: 'var(--text)', fontWeight: n.isRead ? 500 : 700 }}>{n.title}</span>
                                  {!n.isRead && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--teal)' }} />}
                                </span>
                                <span className="block text-sm mt-0.5" style={{ color: 'var(--text-mid)' }}>{n.body}</span>
                                <span className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{timeAgo(n.createdAt)}</span>
                              </span>
                            </button>
                            <button onClick={() => remove(n)} aria-label="Delete notification" className="p-1.5 rounded-lg opacity-60 hover:opacity-100" style={{ color: 'var(--text-muted)' }}>
                              <X size={15} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                ))}
                {items.length < total && (
                  <div className="text-center">
                    <button onClick={() => { const p = page + 1; setPage(p); load(p, filter) }} disabled={loading} className="btn-outline btn-sm">
                      {loading ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
