'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, Bell, Palette, ChevronRight, CheckCheck } from 'lucide-react'
import { notifAPI } from '@/lib/api'
import { useFavoritesStore } from '@/store/favoritesStore'
import ThemePicker from '@/components/shared/ThemePicker'
import { formatDate } from '@/lib/utils'

interface Notif { _id: string; title: string; body: string; read?: boolean; isRead?: boolean; createdAt: string }

// Saved properties, theme and recent notifications in one place on the profile page — the phone header keeps only
// the essentials, so these live here (and in the menu) instead.
export default function AccountQuickSettings({ savedHref }: { savedHref?: string }) {
  const { favorites } = useFavoritesStore()
  const [items, setItems] = useState<Notif[] | null>(null)

  const load = () => notifAPI.getAll({ limit: 6 })
    .then(r => setItems(r.data.data?.data || r.data.data || []))
    .catch(() => setItems([]))
  useEffect(() => { load() }, [])

  const unread = (items || []).filter(n => !(n.read ?? n.isRead)).length
  const markAll = () => notifAPI.markAllRead().then(load).catch(() => {})

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card p-5 space-y-4">
        {savedHref && (
          <Link href={savedHref} className="flex items-center gap-3 group">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}><Bookmark size={16} style={{ color: 'var(--teal)' }} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>Saved properties</span>
              <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{favorites.length} saved</span>
            </span>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
          </Link>
        )}
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}><Palette size={15} style={{ color: 'var(--teal)' }} /> Theme</p>
          <ThemePicker />
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text)' }}>
            <Bell size={15} style={{ color: 'var(--teal)' }} /> Notifications
            {unread > 0 && <span className="text-[10px] font-bold text-white rounded-full px-1.5 py-0.5" style={{ background: 'var(--grad)' }}>{unread}</span>}
          </p>
          {unread > 0 && <button onClick={markAll} className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: 'var(--teal)' }}><CheckCheck size={12} /> Mark all read</button>}
        </div>
        {items === null ? (
          <div className="space-y-2">{[0, 1, 2].map(i => <div key={i} className="shimmer h-10 rounded-lg" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
        ) : (
          <ul className="space-y-2.5">
            {items.map(n => (
              <li key={n._id} className="flex gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: (n.read ?? n.isRead) ? 'transparent' : 'var(--teal)' }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{n.title}</span>
                  <span className="block text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{n.body}</span>
                  <span className="block text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(n.createdAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
