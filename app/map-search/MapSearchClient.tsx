'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { LayoutList, Search, Home, SlidersHorizontal, X } from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import { Pill, FilterDropdown, DropdownOption, TYPES, AREAS, BEDS, PRICES } from '@/components/buyer/PropertyFilterBar'
import { propertyAPI } from '@/lib/api'
import type { Property, PropertyFilters } from '@/types'
import type { MapBounds } from '@/components/buyer/PropertiesMapView'
import toast from 'react-hot-toast'

// Using the free Leaflet/OpenStreetMap map for now — PropertiesGoogleMapView
// is built and ready (components/buyer/PropertiesGoogleMapView.tsx), just
// swap this import + the <PropertiesMapView> usage below back to it once
// NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set in frontend/.env.local.
// Leaflet touches `window` at import time — must never run during Next's
// server render of this (client) page.
const PropertiesMapView = dynamic(() => import('@/components/buyer/PropertiesMapView'), {
  ssr: false,
  loading: () => <div className="shimmer" style={{ height: '100%' }} />,
})

function filtersFromParams(searchParams: URLSearchParams): PropertyFilters {
  return {
    listingType: searchParams.get('listingType') || '',
    type:        searchParams.get('type')        || '',
    q:           searchParams.get('q')           || '',
    area:        searchParams.get('area')        || '',
    community:   searchParams.get('community')   || '',
    bedrooms:    searchParams.get('bedrooms')    || '',
    priceMin:    Number(searchParams.get('priceMin')) || 0,
    priceMax:    Number(searchParams.get('priceMax')) || 0,
    sortBy: 'newest', page: 1, limit: 200,
  }
}

// The dedicated, full-viewport map experience the search box's "Map" button
// opens — mirrors PropertyFinder's own /map-search page. Its own top bar is
// intentionally NOT the homepage SearchBar card — everything (back link,
// live count, and the filter controls) sits in one slim, edge-to-edge
// toolbar above the map instead of stacked, padded sections.
export default function MapSearchClient() {
  const searchParams = useSearchParams()

  const [properties, setProperties] = useState<Property[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filters,    setFilters]    = useState<PropertyFilters>(() => filtersFromParams(searchParams))
  const [query,      setQuery]      = useState(() => searchParams.get('q') || '')

  // Re-sync when the URL changes externally (e.g. a link elsewhere pointing
  // at /map-search?... while this page is already mounted).
  useEffect(() => {
    setFilters(filtersFromParams(searchParams))
    setQuery(searchParams.get('q') || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  const setFilter = (key: keyof PropertyFilters, val: any) => setFilters(f => ({ ...f, [key]: val }))
  const activeCount = [filters.type, filters.area, filters.bedrooms, filters.priceMin].filter(Boolean).length

  const backHref =
    filters.listingType === 'rent' ? '/for-rent' :
    filters.listingType === 'sale' ? '/for-sale' :
    '/buyer/properties'

  const fetchProperties = useCallback(async (bounds?: MapBounds) => {
    setLoading(true)
    try {
      const clean: any = {}
      Object.entries(filters).forEach(([k, v]) => { if (v && k !== 'page' && k !== 'limit' && k !== 'sortBy') clean[k] = v })
      if (bounds) Object.assign(clean, bounds)
      const res = await propertyAPI.getAll({ ...clean, limit: 200 })
      if (res.data.success) setProperties(res.data.data.data)
    } catch {
      toast.error('Failed to load map listings')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchProperties() }, [fetchProperties])

  const submitQuery = () => setFilter('q', query)

  return (
    <div className="page">
      <Navbar />

      {/* Navbar renders its own 64px spacer in normal flow (see
          layouts/Navbar.tsx), so this fills exactly what's left of the
          viewport rather than another full 100vh stacked underneath it. */}
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        {/* ── Toolbar — back link, live count, and filters all in one
            slim, edge-to-edge row (no page padding around it) ── */}
        <div
          className="flex items-center gap-2 flex-shrink-0 flex-wrap"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '10px 12px' }}
        >
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-sm font-medium flex-shrink-0 transition-colors hover:text-[var(--teal)]"
            style={{ color: 'var(--text-mid)' }}
          >
            <LayoutList size={15} />
            Back to list
          </Link>

          <div className="w-px self-stretch flex-shrink-0" style={{ background: 'var(--border)' }} />

          <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Loading…' : `${properties.length.toLocaleString()} properties`}
          </span>

          <div className="w-px self-stretch flex-shrink-0 hidden md:block" style={{ background: 'var(--border)' }} />

          {/* Keyword */}
          <div className="input-glass flex items-center gap-2 h-9 px-3 rounded-lg min-w-0 flex-1 md:max-w-xs">
            <Search size={13} style={{ color: 'var(--teal)', flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitQuery()}
              placeholder="Search keyword, area, project…"
              className="bg-transparent flex-1 text-sm outline-none min-w-0"
              style={{ color: 'var(--text)' }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setFilter('q', '') }} style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                <X size={12} style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>

          {/* Purpose */}
          <div className="flex gap-1 flex-shrink-0">
            <Pill active={filters.listingType === 'sale'} onClick={() => setFilter('listingType', filters.listingType === 'sale' ? '' : 'sale')} className="px-2.5 py-1.5">Buy</Pill>
            <Pill active={filters.listingType === 'rent'} onClick={() => setFilter('listingType', filters.listingType === 'rent' ? '' : 'rent')} className="px-2.5 py-1.5">Rent</Pill>
          </div>

          {/* Property type */}
          <FilterDropdown label={TYPES.find(t => t.v === filters.type)?.l || 'Type'} icon={Home} active={!!filters.type} widthClass="w-52">
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

          {/* Area */}
          <FilterDropdown label={filters.area || 'Area'} active={!!filters.area} widthClass="w-56">
            {close => (
              <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                <DropdownOption active={!filters.area} onClick={() => { setFilter('area', ''); close() }}>Any Area</DropdownOption>
                {AREAS.map(a => (
                  <DropdownOption key={a} active={filters.area === a} onClick={() => { setFilter('area', a); close() }}>{a}</DropdownOption>
                ))}
              </div>
            )}
          </FilterDropdown>

          {/* Bedrooms + Price */}
          <FilterDropdown label="Filters" icon={SlidersHorizontal} active={!!filters.bedrooms || !!filters.priceMin || !!filters.priceMax} widthClass="w-64" align="right">
            {() => (
              <div className="space-y-4">
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
                  <p className="text-[10px] uppercase tracking-widest mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Price</p>
                  <div className="flex flex-col gap-1">
                    {PRICES.map(p => (
                      <DropdownOption key={p.l} active={filters.priceMin === p.min && filters.priceMax === p.max} onClick={() => { setFilter('priceMin', p.min); setFilter('priceMax', p.max) }}>
                        {p.l}
                      </DropdownOption>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </FilterDropdown>

          {(activeCount > 0 || query) && (
            <button
              onClick={() => { setFilters(f => ({ ...f, type: '', area: '', bedrooms: '', priceMin: 0, priceMax: 0, q: '' })); setQuery('') }}
              className="text-xs flex-shrink-0 px-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* ── Big map ─────────────────────────────────────── */}
        <div style={{ flex: 1, position: 'relative' }}>
          <PropertiesMapView
            fullHeight
            properties={properties}
            searching={loading}
            onSearchThisArea={bounds => fetchProperties(bounds)}
          />
        </div>
      </div>
    </div>
  )
}
