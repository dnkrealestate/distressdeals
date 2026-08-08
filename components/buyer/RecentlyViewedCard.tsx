'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clock, Building2 } from 'lucide-react'
import { getRecentlyViewed, type RecentlyViewedItem } from '@/lib/recentlyViewed'
import { formatPrice, rentSuffix } from '@/lib/utils'

// Reads from localStorage on mount only — SSR has no access to it, and since
// this is purely a "what did I just look at" convenience widget, there's no
// need to keep it live-reactive to other tabs.
export default function RecentlyViewedCard({ excludeSlug }: { excludeSlug?: string }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])

  useEffect(() => {
    setItems(getRecentlyViewed().filter(i => i.slug !== excludeSlug).slice(0, 5))
  }, [excludeSlug])

  if (items.length === 0) return null

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(49,178,222,0.10)', border: '1px solid rgba(49,178,222,0.20)' }}>
          <Clock size={15} style={{ color: 'var(--teal)' }} />
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Recently Viewed</h3>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Pick up where you left off</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {items.map(item => (
          <Link key={item.slug} href={`/buyer/properties/${item.slug}`} className="flex items-center gap-3 group">
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
                {formatPrice(item.price)}{rentSuffix(item)}{item.area ? ` · ${item.area}` : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
