'use client'
import type { ReactNode } from 'react'

// The price section of a project / property page, in two columns: the price on the left (with its offer, market
// reference, per-sq-ft and currency notes), the key details on the right as a grid of tiles. Stacks on phones.
export interface PriceDetail { icon: any; label: string; value?: string | number | null }

export default function PriceDetailsCard({ label, price, details }: { label: string; price: ReactNode; details: PriceDetail[] }) {
  const shown = details.filter(d => d.value !== undefined && d.value !== null && d.value !== '')
  return (
    <div className="card overflow-hidden grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
      {/* Price */}
      <div className="p-5 sm:p-6 flex flex-col justify-center gap-0.5"
        style={{ background: 'linear-gradient(135deg, rgba(203,1,1,0.07), rgba(253,113,71,0.04) 60%, transparent)', borderBottom: '1px solid var(--border-soft)' }}>
        <p className="text-[11px] uppercase tracking-[0.14em] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {price}
      </div>
      {/* Details */}
      {shown.length > 0 && (
        <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 content-center md:border-l" style={{ borderColor: 'var(--border-soft)' }}>
          {shown.map(({ icon: Icon, label: l, value }) => (
            <div key={l} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 min-w-0" style={{ background: 'var(--bg-alt)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.10)' }}>
                <Icon size={15} style={{ color: 'var(--teal)' }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }} title={String(value)}>{typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : value}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{l}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
