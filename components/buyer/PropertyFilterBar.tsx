'use client'
import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown, Home, Bed, Bath, DollarSign, MapPin, SlidersHorizontal, Tag,
  Building2, Castle, Layers, Store, LayoutGrid, TreePine, Warehouse, Maximize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PropertyFilters } from '@/types'

/* ─── Shared data — property list pages + the map-search page all filter
   against the same vocabulary, so it lives here once instead of being
   redefined per page. ───────────────────────────────────────────── */
export const CATEGORIES = [
  { v: '',             l: 'All'         },
  { v: 'residential',  l: 'Residential' },
  { v: 'commercial',   l: 'Commercial'  },
]

export const RESIDENTIAL_TYPES = [
  { v: 'apartment',  l: 'Apartment',   icon: Building2   },
  { v: 'villa',      l: 'Villa',       icon: Home        },
  { v: 'penthouse',  l: 'Penthouse',   icon: Castle      },
  { v: 'townhouse',  l: 'Townhouse',   icon: Layers      },
  { v: 'studio',     l: 'Studio',      icon: LayoutGrid  },
]

export const COMMERCIAL_TYPES = [
  { v: 'office',           l: 'Office',           icon: Store      },
  { v: 'retail',           l: 'Retail',           icon: Store      },
  { v: 'warehouse',        l: 'Warehouse',        icon: Warehouse  },
  { v: 'commercial_villa', l: 'Commercial Villa', icon: Home       },
  { v: 'plot',             l: 'Plot',             icon: TreePine   },
]

// Combined list — kept for the map-search page's own compact bar, which
// doesn't (yet) split by category.
export const TYPES = [
  { v: '', l: 'All Types', icon: LayoutGrid },
  ...RESIDENTIAL_TYPES,
  ...COMMERCIAL_TYPES,
]

export const AREAS = [
  'Downtown Dubai','Dubai Marina','Palm Jumeirah','Business Bay','JBR',
  'DIFC','Arabian Ranches','Dubai Hills','MBR City','Jumeirah','Al Barsha',
  'Deira','Bur Dubai','Silicon Oasis','Sports City','JVC','JLT','Al Furjan',
]

export const BEDS   = ['Studio','1','2','3','4','5','6+']
export const BATHS  = ['1','2','3','4','5','6+']
export const PRICES = [
  { l:'Any',        min:0,         max:0          },
  { l:'<500K',      min:0,         max:500000     },
  { l:'500K–1M',    min:500000,    max:1000000    },
  { l:'1M–2M',      min:1000000,   max:2000000    },
  { l:'2M–5M',      min:2000000,   max:5000000    },
  { l:'5M–10M',     min:5000000,   max:10000000   },
  { l:'>10M',       min:10000000,  max:0          },
]

// Commercial listings are measured by floor area, not bedrooms/bathrooms —
// this replaces the "Beds & Baths" filter whenever Commercial is selected.
export const SIZES = [
  { l:'Any',                 min:0,     max:0     },
  { l:'<1,000 sqft',         min:0,     max:1000  },
  { l:'1,000–2,500 sqft',    min:1000,  max:2500  },
  { l:'2,500–5,000 sqft',    min:2500,  max:5000  },
  { l:'5,000–10,000 sqft',   min:5000,  max:10000 },
  { l:'>10,000 sqft',        min:10000, max:0     },
]

/* ─── PILL BUTTON ───────────────────────────────────────────── */
export function Pill({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn('rounded-lg text-xs font-medium border transition-all', className)}
      style={{
        borderColor: active ? 'var(--teal)' : 'var(--border)',
        background:  active ? 'rgba(203,1,1,0.10)' : 'transparent',
        color:       active ? 'var(--teal)' : 'var(--text-muted)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

/* ─── FILTER DROPDOWN (horizontal filter-bar pill, Bayut-style) ───────── */
export function FilterDropdown({
  label, icon: Icon, active, widthClass = 'w-56', align = 'left', children, fullWidth,
}: {
  label: string; icon?: any; active?: boolean; widthClass?: string; align?: 'left' | 'right'
  children: (close: () => void) => React.ReactNode
  // Stretches the trigger button to fill its flex container instead of
  // shrinking to its label's content width — used when a row of filters
  // should span the full row edge-to-edge (the homepage's compact bar).
  fullWidth?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // The trigger button can sit inside a horizontally-scrollable row (see
  // PropertyFilterBar's single-row layout) — a scrollable ancestor forces
  // its overflow-y to clip too, which would cut off an absolutely-positioned
  // panel. Rendering the panel through a portal at a fixed, measured
  // position sidesteps that entirely, regardless of what scrolls above it.
  useLayoutEffect(() => {
    if (!open) return
    const updatePosition = () => {
      const rect = btnRef.current?.getBoundingClientRect()
      if (!rect) return
      setCoords(
        align === 'right'
          ? { top: rect.bottom + 8, right: window.innerWidth - rect.right }
          : { top: rect.bottom + 8, left: rect.left }
      )
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, align])

  return (
    <div ref={ref} className={cn('relative', fullWidth ? 'flex-1 min-w-0' : 'flex-shrink-0')}>
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center h-10 px-3.5 rounded-lg border text-xs font-semibold transition-all',
          fullWidth ? 'w-full justify-between gap-2' : 'gap-1.5 whitespace-nowrap'
        )}
        style={{
          borderColor: open || active ? 'var(--teal)' : 'var(--border)',
          background:  open || active ? 'rgba(203,1,1,0.08)' : 'var(--surface)',
          color:       open || active ? 'var(--teal)' : 'var(--text-mid)',
        }}
      >
        <span className={cn('flex items-center gap-1.5 min-w-0', fullWidth && 'truncate')}>
          {Icon && <Icon size={13} className="flex-shrink-0" />}
          <span className={fullWidth ? 'truncate' : undefined}>{label}</span>
        </span>
        <ChevronDown size={11} className={cn('flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && coords && (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className={cn('fixed z-[999] rounded-xl shadow-lg p-3.5', widthClass)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', top: coords.top, left: coords.left, right: coords.right }}
            >
              {children(() => setOpen(false))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

export function DropdownOption({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
      style={{ background: active ? 'rgba(203,1,1,0.08)' : 'transparent', color: active ? 'var(--teal)' : 'var(--text-mid)' }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-alt)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

export function DropdownLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
      style={{ background: active ? 'rgba(203,1,1,0.08)' : 'transparent', color: active ? 'var(--teal)' : 'var(--text-mid)' }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-alt)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {children}
    </Link>
  )
}

/* ─── The full Bayut-style filter row: Purpose / Type / Bedrooms / Price /
   Area / More Filters + Clear all. Shared by the properties list pages
   (Purpose = links to /for-sale, /for-rent) and the map-search page
   (Purpose = an in-place toggle, since it's a single route). ─────────── */
export function PropertyFilterBar({
  filters, setFilter, clearFilters, activeCount,
  purposeHrefs, onPurposeChange,
}: {
  filters: PropertyFilters
  setFilter: (key: keyof PropertyFilters, val: any) => void
  clearFilters: () => void
  activeCount: number
  purposeHrefs?: { sale: string; rent: string }
  onPurposeChange?: (v: 'sale' | 'rent') => void
}) {
  const purposeLabel = filters.listingType === 'rent' ? 'Rent' : filters.listingType === 'sale' ? 'Buy' : 'Buy / Rent'
  const category = (filters as any).category || ''
  const isCommercial = category === 'commercial'
  const typeOptions =
    category === 'commercial'  ? [{ v: '', l: 'All Types', icon: LayoutGrid }, ...COMMERCIAL_TYPES]  :
    category === 'residential' ? [{ v: '', l: 'All Types', icon: LayoutGrid }, ...RESIDENTIAL_TYPES] :
    TYPES

  const setCategory = (v: string) => {
    setFilter('category' as any, v)
    // Whatever type was picked under the old category rarely makes sense
    // under the new one (e.g. "Villa" while switching to Commercial).
    setFilter('type', '')
  }

  const bedsBathsLabel = filters.bedrooms || (filters as any).bathrooms
    ? [
        filters.bedrooms ? (filters.bedrooms === 'Studio' ? 'Studio' : `${filters.bedrooms} Bed`) : null,
        (filters as any).bathrooms ? `${(filters as any).bathrooms} Bath` : null,
      ].filter(Boolean).join(', ')
    : 'Beds & Baths'

  const sizeLabel = SIZES.find(s => s.min === (filters as any).sizeMin && s.max === (filters as any).sizeMax && (s.min || s.max))?.l || 'Area (sqft)'

  return (
    <div className="flex items-center gap-2 flex-nowrap overflow-x-auto scrollbar-hide">
      {/* Residential / Commercial — reshapes what the Type and Beds & Baths
          filters even mean, so it stays visually first, but shares the
          same single scrollable row as everything else instead of its own
          line — the whole bar scrolls horizontally as one unit rather than
          ever wrapping to a second row. */}
      {CATEGORIES.map(c => (
        <Pill key={c.v} active={category === c.v} onClick={() => setCategory(c.v)} className="px-3.5 py-1.5 flex-shrink-0 whitespace-nowrap">
          {c.l}
        </Pill>
      ))}

      <div className="w-px h-6 flex-shrink-0" style={{ background: 'var(--border)' }} />

      {/* Purpose */}
        <FilterDropdown label={purposeLabel} icon={Tag} active widthClass="w-40">
          {close => (
            <div className="flex flex-col gap-1">
              {purposeHrefs ? (
                <>
                  <DropdownLink href={purposeHrefs.sale} active={filters.listingType === 'sale'}>Buy</DropdownLink>
                  <DropdownLink href={purposeHrefs.rent} active={filters.listingType === 'rent'}>Rent</DropdownLink>
                </>
              ) : (
                <>
                  <DropdownOption active={filters.listingType === 'sale'} onClick={() => { onPurposeChange?.('sale'); close() }}>Buy</DropdownOption>
                  <DropdownOption active={filters.listingType === 'rent'} onClick={() => { onPurposeChange?.('rent'); close() }}>Rent</DropdownOption>
                </>
              )}
            </div>
          )}
        </FilterDropdown>

        {/* Property type — scoped to the selected category */}
        <FilterDropdown label={typeOptions.find(t => t.v === filters.type)?.l || 'Property Type'} icon={Home} active={!!filters.type} widthClass="w-52">
          {close => (
            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
              {typeOptions.map(t => (
                <DropdownOption key={t.v} active={filters.type === t.v} onClick={() => { setFilter('type', t.v); close() }}>
                  {t.l}
                </DropdownOption>
              ))}
            </div>
          )}
        </FilterDropdown>

        {/* Beds & Baths (residential) — swapped for Area (sqft) when
            Commercial is selected, since floor area is what matters there. */}
        {isCommercial ? (
          <FilterDropdown label={sizeLabel} icon={Maximize2} active={!!(filters as any).sizeMin || !!(filters as any).sizeMax} widthClass="w-52">
            {close => (
              <div className="flex flex-col gap-1">
                {SIZES.map(s => (
                  <DropdownOption
                    key={s.l}
                    active={(filters as any).sizeMin === s.min && (filters as any).sizeMax === s.max}
                    onClick={() => { setFilter('sizeMin' as any, s.min); setFilter('sizeMax' as any, s.max); close() }}
                  >
                    {s.l}
                  </DropdownOption>
                ))}
              </div>
            )}
          </FilterDropdown>
        ) : (
          <FilterDropdown label={bedsBathsLabel} icon={Bed} active={!!filters.bedrooms || !!(filters as any).bathrooms} widthClass="w-56">
            {() => (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Bedrooms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {BEDS.map(b => (
                      <Pill key={b} active={filters.bedrooms === b} onClick={() => setFilter('bedrooms', filters.bedrooms === b ? '' : b)} className="px-2.5 py-1.5">
                        {b === 'Studio' ? 'Studio' : `${b} BR`}
                      </Pill>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Bathrooms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {BATHS.map(b => (
                      <Pill key={b} active={(filters as any).bathrooms === b} onClick={() => setFilter('bathrooms' as any, (filters as any).bathrooms === b ? '' : b)} className="px-2.5 py-1.5">
                        {b} Bath
                      </Pill>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </FilterDropdown>
        )}

        {/* Price */}
        <FilterDropdown label={PRICES.find(p => p.min === filters.priceMin && p.max === filters.priceMax && (p.min || p.max))?.l || 'Price'} icon={DollarSign} active={!!filters.priceMin || !!filters.priceMax} widthClass="w-48">
          {close => (
            <div className="flex flex-col gap-1">
              {PRICES.map(p => (
                <DropdownOption key={p.l} active={filters.priceMin === p.min && filters.priceMax === p.max} onClick={() => { setFilter('priceMin', p.min); setFilter('priceMax', p.max); close() }}>
                  {p.l}
                </DropdownOption>
              ))}
            </div>
          )}
        </FilterDropdown>

        {/* Area */}
        <FilterDropdown label={filters.area || 'Area'} icon={MapPin} active={!!filters.area} widthClass="w-56">
          {close => (
            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
              <DropdownOption active={!filters.area} onClick={() => { setFilter('area', ''); close() }}>Any Area</DropdownOption>
              {AREAS.map(a => (
                <DropdownOption key={a} active={filters.area === a} onClick={() => { setFilter('area', a); close() }}>{a}</DropdownOption>
              ))}
            </div>
          )}
        </FilterDropdown>

        {/* More filters — Completion + Furnishing */}
        <FilterDropdown label="More Filters" icon={SlidersHorizontal} active={!!(filters as any).completion || !!(filters as any).furnishing} widthClass="w-64" align="right">
          {close => (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Completion</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[{ v: '', l: 'All' }, { v: 'ready', l: 'Ready' }, { v: 'off_plan', l: 'Off-Plan' }].map(o => (
                    <Pill key={o.v} active={(filters as any).completion === o.v} onClick={() => setFilter('completion' as any, o.v)} className="py-1.5">{o.l}</Pill>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Furnishing</p>
                <div className="flex flex-col gap-1.5">
                  {[{ v: '', l: 'Any' }, { v: 'furnished', l: 'Furnished' }, { v: 'semi_furnished', l: 'Semi Furnished' }, { v: 'unfurnished', l: 'Unfurnished' }].map(o => (
                    <Pill key={o.v} active={(filters as any).furnishing === o.v} onClick={() => setFilter('furnishing' as any, o.v)} className="py-1.5 px-3 text-left">{o.l}</Pill>
                  ))}
                </div>
              </div>
              <button onClick={close} className="btn-primary btn-sm w-full">Done</button>
            </div>
          )}
        </FilterDropdown>

      {activeCount > 0 && (
        <button onClick={clearFilters} className="text-xs flex-shrink-0 px-2 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Clear all</button>
      )}
    </div>
  )
}
