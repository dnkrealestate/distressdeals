'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Building2, Clock, Search } from 'lucide-react'
import { getRecentlyViewed, type RecentlyViewedItem } from '@/lib/recentlyViewed'
import { formatPrice, rentSuffix } from '@/lib/utils'

function timeAgo(ms: number): string {
  const mins = Math.floor((Date.now() - ms) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d ago`
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Properties this person has actually opened, most recent first — kept on this device (see lib/recentlyViewed),
// same as any browser's history rather than something tied to their account.
export default function RecentActivity() {
  const [items, setItems] = useState<RecentlyViewedItem[] | null>(null)

  useEffect(() => { setItems(getRecentlyViewed()) }, [])

  if (items === null) {
    return <div className="space-y-3">{Array(3).fill(null).map((_, i) => <div key={i} className="shimmer h-20 rounded-2xl" />)}</div>
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-10 px-4 rounded-2xl" style={{ background: 'var(--bg-alt)', border: '1px dashed var(--border)' }}>
        <Clock size={26} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Nothing viewed yet</p>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Properties you open will show up here, most recent first.</p>
        <Link href="/buyer/properties" className="btn-primary btn-sm"><Search size={13} /> Browse properties</Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <Link key={item.slug} href={`/buyer/properties/${item.slug}`} className="card p-3.5 flex items-center gap-4 transition-colors hover:border-[rgba(203,1,1,0.35)]">
          <div className="w-16 h-16 rounded-xl flex-shrink-0 relative overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
            {item.image ? <Image src={item.image} alt="" fill className="object-cover" sizes="64px" /> : (
              <div className="w-full h-full flex items-center justify-center"><Building2 size={20} style={{ color: 'var(--text-muted)', opacity: 0.4 }} /></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{item.title}</p>
            <div className="flex items-center gap-3 text-xs mt-1 flex-wrap" style={{ color: 'var(--text-muted)' }}>
              {item.area && <span>{item.area}</span>}
              <span className="font-medium" style={{ color: 'var(--teal)' }}>{formatPrice(item.price)}{rentSuffix({ listingType: item.listingType })}</span>
              <span className="flex items-center gap-1"><Clock size={10} /> Viewed {timeAgo(item.viewedAt)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
