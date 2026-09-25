'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, Building2 } from 'lucide-react'
import { useRecentlyViewed, recentlyViewedHref, clearRecentlyViewed } from '@/lib/recentlyViewed'
import { formatPrice, rentSuffix } from '@/lib/utils'

function ago(ms: number) {
  const m = Math.floor((Date.now() - ms) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h} h ago` : `${Math.floor(h / 24)} d ago`
}

// Sidebar list of what this visitor opened most recently — properties and new projects, newest first, live.
// `exclude` hides the page you're currently on ("property:<slug>" or "project:<slug>").
export default function RecentlyViewedCard({ exclude, limit = 5 }: { exclude?: string; limit?: number }) {
  const all = useRecentlyViewed()
  const items = (all || []).filter(i => `${i.kind || 'property'}:${i.slug}` !== exclude).slice(0, limit)
  if (items.length === 0) return null

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
          <Clock size={15} style={{ color: 'var(--teal)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Recently Viewed</h3>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Pick up where you left off</p>
        </div>
        <button onClick={clearRecentlyViewed} className="text-[11px] font-medium hover:underline flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          Clear
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {items.map(item => (
          <Link key={`${item.kind || 'property'}:${item.slug}`} href={recentlyViewedHref(item)} className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-lg flex-shrink-0 relative overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
              {item.image ? (
                <Image src={item.image} alt="" fill className="object-cover" sizes="44px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Building2 size={16} style={{ color: 'var(--text-muted)', opacity: 0.4 }} /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>{item.title}</p>
              <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                {item.kind === 'project' ? 'From ' : ''}{formatPrice(item.price)}{item.kind === 'project' ? '' : rentSuffix(item)}
                {item.area ? ` · ${item.area}` : ''}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.8 }}>
                {item.kind === 'project' ? 'New project · ' : ''}Viewed {ago(item.viewedAt)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
