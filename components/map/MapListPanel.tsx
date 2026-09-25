'use client'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpDown, Bath, Bed, Car, ChevronDown, ChevronUp, Maximize2, SearchX, TrendingUp } from 'lucide-react'
import { formatPrice, rentSuffix, cn } from '@/lib/utils'
import { PANEL_SORTS, formatType, type MapPin, type PanelSort, type PinStats } from '@/lib/mapPins'
import RentalBadge from '@/components/buyer/RentalBadge'
import { formatDrive, TAG_COLORS } from '@/lib/driveTime'

// The results list beside the map: everything currently in view, sortable,
// with a market snapshot on top. Hovering a card highlights its pin (and the
// reverse); clicking selects it and the map pans to it.
export default function MapListPanel({
  pins, stats, sort, onSort, selectedId, hoverId, onSelect, onHover, loading, capped, total, hasArea,
}: {
  pins: MapPin[]
  stats: PinStats[]
  sort: PanelSort
  onSort: (s: PanelSort) => void
  selectedId: string | null
  hoverId: string | null
  onSelect: (pin: MapPin) => void
  onHover: (id: string | null) => void
  loading: boolean
  capped: boolean
  total: number
  hasArea: boolean
}) {
  const [showStats, setShowStats] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)

  // A pin clicked on the map should bring its card into view.
  useEffect(() => {
    if (!selectedId) return
    listRef.current?.querySelector<HTMLElement>(`[data-pin-id="${selectedId}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: 'var(--surface)' }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            {loading && pins.length === 0 ? 'Searching…' : `${pins.length.toLocaleString()} ${pins.length === 1 ? 'property' : 'properties'} ${hasArea ? 'in your area' : 'in view'}`}
          </p>
          {capped && (
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Showing the first 1,000 of {total.toLocaleString()} — zoom in or draw an area to narrow down</p>
          )}
        </div>
        <div className="relative flex-shrink-0">
          <select
            value={sort}
            onChange={e => onSort(e.target.value as PanelSort)}
            className="select-field appearance-none pr-7 py-1.5 text-xs cursor-pointer"
            aria-label="Sort results"
          >
            {PANEL_SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
          <ArrowUpDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto">
        {/* Market snapshot for what's on screen */}
        {stats.length > 0 && (
          <div className="px-4 pt-3">
            <button
              onClick={() => setShowStats(v => !v)}
              className="w-full flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="inline-flex items-center gap-1.5"><TrendingUp size={12} /> Market snapshot</span>
              {showStats ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {showStats && (
              <div className={cn('grid gap-2 mt-2', stats.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
                {stats.map(s => (
                  <div key={s.lt} className="rounded-xl p-3" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--teal)' }}>
                      {s.lt === 'sale' ? 'For sale' : 'For rent'} · {s.count}
                    </p>
                    <dl className="space-y-1 text-[11px]">
                      <Row label="Median" value={formatPrice(s.medianPrice)} />
                      <Row label="Average" value={formatPrice(s.avgPrice)} />
                      {s.avgPpsf ? <Row label="AED / sqft" value={Math.round(s.avgPpsf).toLocaleString()} /> : null}
                      <Row label="Range" value={s.count > 1 ? `${formatPrice(s.minPrice)} – ${formatPrice(s.maxPrice)}` : formatPrice(s.minPrice)} />
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cards */}
        <div className="p-3 space-y-2.5">
          {pins.length === 0 && !loading && (
            <div className="flex flex-col items-center text-center py-14 px-6">
              <SearchX size={26} style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-semibold mt-3" style={{ color: 'var(--text)' }}>No properties here</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Move or zoom the map, widen your drawn area, or relax a filter.</p>
            </div>
          )}
          {pins.map(p => {
            const selected = p.id === selectedId
            const hover = p.id === hoverId
            return (
              <button
                key={p.id}
                data-pin-id={p.id}
                onClick={() => onSelect(p)}
                onMouseEnter={() => onHover(p.id)}
                onMouseLeave={() => onHover(null)}
                className="w-full flex text-left rounded-xl overflow-hidden transition-all"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${selected ? 'var(--teal)' : hover ? 'rgba(203,1,1,0.45)' : 'var(--border)'}`,
                  boxShadow: selected ? '0 0 0 2px rgba(203,1,1,0.18)' : undefined,
                }}
              >
                <div className="relative w-[104px] h-[92px] flex-shrink-0" style={{ background: 'var(--bg-alt)' }}>
                  {p.img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  {p.kind === 'project' && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: '#8B5CF6' }}>New Project</span>
                  )}
                  {p.featured && (
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--grad)' }}>★ Featured</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 px-3 py-2">
                  <p className="text-sm font-extrabold grad-text leading-tight">
                    {p.kind === 'project' && <span className="text-[10px] font-semibold mr-1" style={{ color: 'var(--text-muted)' }}>From</span>}
                    {formatPrice(p.price)}<span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{rentSuffix({ listingType: p.lt, rentFrequency: p.rf })}</span>
                  </p>
                  <p className="text-xs font-medium truncate mt-0.5" style={{ color: 'var(--text)' }}>{p.title}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{[p.community, p.area].filter(Boolean).join(', ') || '—'}</p>
                  <div className="flex items-center gap-2.5 mt-1.5 text-[11px]" style={{ color: 'var(--text-mid)' }}>
                    <span className="font-medium">{formatType(p.type)}</span>
                    {p.lt === 'rent' && <RentalBadge property={{ listingType: 'rent', rentalStatus: p.rs, availableFrom: p.af }} />}
                    {p.beds > 0 && <span className="inline-flex items-center gap-0.5"><Bed size={10} />{p.beds}</span>}
                    {p.baths > 0 && <span className="inline-flex items-center gap-0.5"><Bath size={10} />{p.baths}</span>}
                    {p.size > 0 && <span className="inline-flex items-center gap-0.5"><Maximize2 size={10} />{Math.round(p.size).toLocaleString()}</span>}
                    {p.bedsLabel && <span className="inline-flex items-center gap-0.5"><Bed size={10} />{p.bedsLabel}</span>}
                    {p.handover && <span className="truncate">Handover {p.handover}</span>}
                  </div>
                  {p.drive && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.drive.secs.map((s, i) => (
                        <span key={p.drive!.tags[i]} className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: `${TAG_COLORS[p.drive!.tags[i]]}1F`, color: TAG_COLORS[p.drive!.tags[i]] }}>
                          <Car size={9} />{p.drive!.tags[i]} · {formatDrive(s)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt style={{ color: 'var(--text-muted)' }}>{label}</dt>
      <dd className="font-semibold text-right" style={{ color: 'var(--text)' }}>{value}</dd>
    </div>
  )
}
