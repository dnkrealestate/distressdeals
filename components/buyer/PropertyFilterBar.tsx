'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown, Home, Bed, DollarSign, MapPin, SlidersHorizontal, Tag,
  Building2, Castle, Layers, Store, LayoutGrid, TreePine,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PropertyFilters } from '@/types'

/* ─── Shared data — property list pages + the map-search page all filter
   against the same vocabulary, so it lives here once instead of being
   redefined per page. ───────────────────────────────────────────── */
export const TYPES = [
  { v: '',           l: 'All Types',   icon: LayoutGrid  },
  { v: 'apartment',  l: 'Apartment',   icon: Building2   },
  { v: 'villa',      l: 'Villa',       icon: Home        },
  { v: 'penthouse',  l: 'Penthouse',   icon: Castle      },
  { v: 'townhouse',  l: 'Townhouse',   icon: Layers      },
  { v: 'studio',     l: 'Studio',      icon: LayoutGrid  },
  { v: 'office',     l: 'Office',      icon: Store       },
  { v: 'plot',       l: 'Plot',        icon: TreePine    },
]

export const AREAS = [
  'Downtown Dubai','Dubai Marina','Palm Jumeirah','Business Bay','JBR',
  'DIFC','Arabian Ranches','Dubai Hills','MBR City','Jumeirah','Al Barsha',
  'Deira','Bur Dubai','Silicon Oasis','Sports City','JVC','JLT','Al Furjan',
]

export const BEDS   = ['Studio','1','2','3','4','5','6+']
export const PRICES = [
  { l:'Any',        min:0,         max:0          },
  { l:'<500K',      min:0,         max:500000     },
  { l:'500K–1M',    min:500000,    max:1000000    },
  { l:'1M–2M',      min:1000000,   max:2000000    },
  { l:'2M–5M',      min:2000000,   max:5000000    },
  { l:'5M–10M',     min:5000000,   max:10000000   },
  { l:'>10M',       min:10000000,  max:0          },
]

/* ─── PILL BUTTON ───────────────────────────────────────────── */
export function Pill({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn('rounded-lg text-xs font-medium border transition-all', className)}
      style={{
        borderColor: active ? 'var(--teal)' : 'var(--border)',
        background:  active ? 'rgba(49,178,222,0.10)' : 'transparent',
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
  label, icon: Icon, active, widthClass = 'w-56', align = 'left', children,
}: {
  label: string; icon?: any; active?: boolean; widthClass?: string; align?: 'left' | 'right'
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-10 px-3.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all"
        style={{
          borderColor: open || active ? 'var(--teal)' : 'var(--border)',
          background:  open || active ? 'rgba(49,178,222,0.08)' : 'var(--surface)',
          color:       open || active ? 'var(--teal)' : 'var(--text-mid)',
        }}
      >
        {Icon && <Icon size={13} />}
        {label}
        <ChevronDown size={11} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className={cn('absolute top-full mt-2 z-40 rounded-xl shadow-lg p-3.5', widthClass, align === 'right' ? 'right-0' : 'left-0')}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DropdownOption({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
      style={{ background: active ? 'rgba(49,178,222,0.08)' : 'transparent', color: active ? 'var(--teal)' : 'var(--text-mid)' }}
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
      style={{ background: active ? 'rgba(49,178,222,0.08)' : 'transparent', color: active ? 'var(--teal)' : 'var(--text-mid)' }}
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

  return (
    <div className="flex items-center gap-2 flex-wrap">
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

      {/* Property type */}
      <FilterDropdown label={TYPES.find(t => t.v === filters.type)?.l || 'Property Type'} icon={Home} active={!!filters.type} widthClass="w-52">
        {close => (
          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
            {TYPES.map(t => (
              <DropdownOption key={t.v} active={filters.type === t.v} onClick={() => { setFilter('type', t.v); close() }}>
                {t.l}
              </DropdownOption>
            ))}
          </div>
        )}
      </FilterDropdown>

      {/* Bedrooms */}
      <FilterDropdown label={filters.bedrooms ? `${filters.bedrooms === 'Studio' ? 'Studio' : filters.bedrooms + ' BR'}` : 'Bedrooms'} icon={Bed} active={!!filters.bedrooms} widthClass="w-48">
        {() => (
          <div className="flex flex-wrap gap-1.5">
            {BEDS.map(b => (
              <Pill key={b} active={filters.bedrooms === b} onClick={() => setFilter('bedrooms', filters.bedrooms === b ? '' : b)} className="px-2.5 py-1.5">
                {b === 'Studio' ? 'Studio' : `${b} BR`}
              </Pill>
            ))}
          </div>
        )}
      </FilterDropdown>

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
        <button onClick={clearFilters} className="text-xs flex-shrink-0 px-2" style={{ color: 'var(--text-muted)' }}>Clear all</button>
      )}
    </div>
  )
}
