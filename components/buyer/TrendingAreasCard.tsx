'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Flame } from 'lucide-react'
import { propertyAPI } from '@/lib/api'
import type { TrendingArea } from '@/types'

// Trending Areas — ranked by how many people opened listings there this week (live data from the backend), with the
// change against last week once there's a week to compare. Each row opens this same list filtered to that area.
export default function TrendingAreasCard({ kind, basePath }: { kind: 'sale' | 'rent'; basePath: string }) {
  const [areas, setAreas] = useState<TrendingArea[] | null>(null)

  useEffect(() => {
    let alive = true
    propertyAPI.getTrendingAreas(kind, 5)
      .then(r => { if (alive) setAreas(r.data.data || []) })
      .catch(() => { if (alive) setAreas([]) })
    return () => { alive = false }
  }, [kind])

  if (areas && areas.length === 0) return null
  const anyViews = !!areas?.some(a => a.views > 0)

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)', border: '1px solid rgba(203,1,1,0.20)' }}>
          <TrendingUp size={15} style={{ color: 'var(--teal)' }} />
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Trending Areas</h3>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{anyViews ? 'Most viewed this week' : 'Most listings right now'}</p>
        </div>
      </div>

      {!areas ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-10 rounded-lg" />)}</div>
      ) : (
        <div className="flex flex-col gap-1">
          {areas.map((a, i) => (
            <Link
              key={a.area}
              href={`${basePath}?area=${encodeURIComponent(a.area)}`}
              className="flex items-center justify-between gap-2 py-2.5 px-2 rounded-lg transition-colors group hover:bg-[rgba(203,1,1,0.05)]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)' }}>
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate transition-colors group-hover:text-[var(--teal)]" style={{ color: 'var(--text)' }}>{a.area}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {a.listings.toLocaleString()} {a.listings === 1 ? 'listing' : 'listings'}
                    {a.views > 0 && ` · ${a.views.toLocaleString()} ${a.views === 1 ? 'view' : 'views'}`}
                  </p>
                </div>
              </div>
              {a.change !== null ? (
                <span className="text-xs font-semibold flex items-center gap-0.5 flex-shrink-0" style={{ color: a.change >= 0 ? 'var(--green)' : '#E11D48' }}>
                  {a.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {a.change >= 0 ? '+' : ''}{a.change}%
                </span>
              ) : a.isNew ? (
                <span className="text-[10px] font-semibold flex items-center gap-0.5 flex-shrink-0" style={{ color: '#EA580C' }}><Flame size={11} /> New</span>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
