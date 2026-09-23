'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Building2, Eye, TrendingUp } from 'lucide-react'
import { propertyAPI } from '@/lib/api'
import type { Property } from '@/types'

// A quick-access card into "My Listings" (frontend/app/seller/(dashboard)/listings) — that page already lists
// every listing with its own view count and interested (lead) count, and opening one goes to the dashboard's own
// listing detail page, so this is just the entry point plus a total worth glancing at.
export default function SellerListingsSummary() {
  const [listings, setListings] = useState<Property[] | null>(null)

  useEffect(() => {
    propertyAPI.myListings({ limit: 100 })
      .then(r => setListings(r.data.success ? r.data.data.data : []))
      .catch(() => setListings([]))
  }, [])

  const views = listings?.reduce((sum, p) => sum + (p.stats?.views || 0), 0) ?? 0
  const leads = listings?.reduce((sum, p) => sum + (p.stats?.leads || 0), 0) ?? 0

  return (
    <Link href="/seller/listings" className="card p-5 flex items-center gap-4 transition-colors hover:border-[rgba(203,1,1,0.35)]">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--grad)' }}>
        <Building2 size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold" style={{ color: 'var(--text)' }}>My Listings</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {listings === null ? 'Loading…' : `${listings.length} listing${listings.length === 1 ? '' : 's'}`}
          {listings && listings.length > 0 && (
            <span className="inline-flex items-center gap-3 ml-2">
              <span className="inline-flex items-center gap-1"><Eye size={11} /> {views} views</span>
              <span className="inline-flex items-center gap-1"><TrendingUp size={11} /> {leads} interested</span>
            </span>
          )}
        </p>
      </div>
      <ArrowRight size={16} style={{ color: 'var(--teal)' }} className="flex-shrink-0" />
    </Link>
  )
}
