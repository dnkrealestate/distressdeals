'use client'
import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { LayoutList, List, Map as MapIcon, PanelLeftClose, PanelLeftOpen, Search, Home, SlidersHorizontal, X } from 'lucide-react'
import Navbar from '@/components/layouts/Navbar'
import { Pill, FilterDropdown, DropdownOption, TYPES, AREAS, BEDS, PRICES } from '@/components/buyer/PropertyFilterBar'
import MapListPanel from '@/components/map/MapListPanel'
import PinPreviewCard from '@/components/map/PinPreviewCard'
import { MapToolbar, RadiusControl, LayersControl, HeatLegend } from '@/components/map/MapTools'
import type { MapEngineHandle } from '@/components/map/MapEngine'
import { propertyAPI } from '@/lib/api'
import { AVAILABILITY_FILTERS, AVAILABLE_WITHIN } from '@/lib/rental'
import MapPlaceSearch from '@/components/map/MapPlaceSearch'
import type { ResolvedPlace } from '@/lib/placeSearch'
import CommutePanel, { type CommuteState } from '@/components/map/CommutePanel'
import { fetchDriveTimes, fetchRoute, reachKm, withinReach, type DriveOrigin, type RouteView } from '@/lib/driveTime'
import { DUBAI_CENTER, type MapBounds } from '@/lib/googleMaps'
import {
  areaToParams, boundsContain, computeStats, decodeAreaFromUrl, encodeAreaForUrl, inBounds, padBounds, sortPins,
  type ColorMode, type DrawMode, type MapPin, type MapType, type PanelSort, type SearchArea, type ViewState,
} from '@/lib/mapPins'
import { cn } from '@/lib/utils'
import type { PropertyFilters } from '@/types'
import toast from 'react-hot-toast'

// Loaded client-side only — the Maps script needs `window`.
const MapEngine = dynamic(() => import('@/components/map/MapEngine'), {
  ssr: false,
  loading: () => <div className="shimmer w-full h-full" />,
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
    rentalStatus:    searchParams.get('rentalStatus') || '',
    availableWithin: Number(searchParams.get('availableWithin')) || 0,
  }
}

function initialViewFromParams(sp: URLSearchParams) {
  const c = sp.get('c')?.split(',').map(Number)
  const z = Number(sp.get('z'))
  if (c && c.length === 2 && c.every(Number.isFinite) && Number.isFinite(z) && z > 0) return { lat: c[0], lng: c[1], zoom: z }
  return undefined
}

// The dedicated, full-viewport map search — the search box's "Map" button opens
// it. Beyond a plain pin map it is a property-finding workbench: a synced results
// panel with a live market snapshot, price/heat pins that cluster, draw-your-own
// area and radius search, near-me, Street View, traffic/transit/satellite layers,
// and shareable views.
export default function MapSearchClient() {
  return (
    <Suspense fallback={null}>
      <MapSearchClientInner />
    </Suspense>
  )
}

function MapSearchClientInner() {
  const searchParams = useSearchParams()
  const engineRef = useRef<MapEngineHandle | null>(null)

  // ── Search state ───────────────────────────────────────────────────────
  const [filters, setFilters] = useState<PropertyFilters>(() => filtersFromParams(searchParams))
  const [query, setQuery] = useState(() => searchParams.get('q') || '')
  // ?only=project:<slug> / property:<slug> — opened from a detail page's "Map View": just that listing.
  const [only, setOnly] = useState(() => searchParams.get('only') || '')
  const [area, setArea] = useState<SearchArea>(() => decodeAreaFromUrl(searchParams))
  const [radiusKm, setRadiusKm] = useState(() => {
    const a = decodeAreaFromUrl(searchParams)
    return a?.kind === 'circle' ? a.radiusKm : 2
  })
  const initialView = useMemo(() => initialViewFromParams(searchParams), []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Results ────────────────────────────────────────────────────────────
  const [pins, setPins] = useState<MapPin[]>([])
  const [total, setTotal] = useState(0)
  const [capped, setCapped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fetchedBounds, setFetchedBounds] = useState<MapBounds | null>(null)
  const [viewport, setViewport] = useState<ViewState | null>(null)
  const [fitSignal, setFitSignal] = useState(0)
  const requestId = useRef(0)
  const skipFirstFit = useRef(!!initialView)

  // ── UI state ───────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [drawMode, setDrawMode] = useState<DrawMode>('none')
  const [mapType, setMapType] = useState<MapType>('roadmap')
  const [traffic, setTraffic] = useState(false)
  const [transit, setTransit] = useState(false)
  const [colorMode, setColorMode] = useState<ColorMode>('brand')
  const [clustering, setClustering] = useState(true)
  const [sort, setSort] = useState<PanelSort>('featured')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  // A place picked from the search box — the map jumps there and marks it.
  const [place, setPlace] = useState<ResolvedPlace | null>(null)
  const [locating, setLocating] = useState(false)
  // Drive-time search: one or two places (A / B) and a max drive time; results replace the map's pins.
  const [commuteOpen, setCommuteOpen] = useState(false)
  const [commute, setCommute] = useState<CommuteState>({ places: [null, null], minutes: 20, mode: 'both' })
  const [commuteResults, setCommuteResults] = useState<MapPin[] | null>(null)
  const [commuteRunning, setCommuteRunning] = useState(false)
  const [commuteError, setCommuteError] = useState('')
  const [commuteProvider, setCommuteProvider] = useState<string | null>(null)
  const commuteRun = useRef(0)
  // Directions to the selected property: where they start from (searched in the card) and the routes found.
  const [fromPlace, setFromPlace] = useState<ResolvedPlace | null>(null)
  const [routes, setRoutes] = useState<RouteView[]>([])
  const [routesLoading, setRoutesLoading] = useState(false)
  const [routesError, setRoutesError] = useState(false)  // What the map and list show: drive-time matches while that search is active, else the normal results.
  const shownPins = commuteResults ?? pins
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map')
  const [panelOpen, setPanelOpen] = useState(true)
  const [streetViewOpen, setStreetViewOpen] = useState(false)

  // Re-sync filters when the URL changes externally (a link elsewhere pointing at
  // /map-search?... while this page is already mounted).
  useEffect(() => {
    setFilters(filtersFromParams(searchParams))
    setQuery(searchParams.get('q') || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

  const setFilter = (key: keyof PropertyFilters, val: any) => setFilters(f => ({ ...f, [key]: val }))
  const activeCount = [filters.type, filters.area, filters.bedrooms, filters.priceMin, filters.rentalStatus, filters.availableWithin].filter(Boolean).length

  const [onlyKind, onlySlug] = only.split(':')
  const backHref =
    only ? (onlyKind === 'project' ? `/projects/${onlySlug}` : `/buyer/properties/${onlySlug}`) :
    filters.listingType === 'rent' ? '/for-rent' :
    filters.listingType === 'sale' ? '/for-sale' :
    '/buyer/properties'

  // ── Fetching ───────────────────────────────────────────────────────────
  const baseParams = useCallback(() => {
    if (only) return { only }
    const clean: any = {}
    Object.entries(filters).forEach(([k, v]) => { if (v) clean[k] = v })
    return { ...clean, ...areaToParams(area) }
  }, [filters, area, only])

  const fetchPins = useCallback(async (opts: { bounds?: MapBounds; fit?: boolean } = {}) => {
    const id = ++requestId.current
    setLoading(true)
    try {
      const res = await propertyAPI.getMapPins({ ...baseParams(), ...(opts.bounds ?? {}) })
      if (id !== requestId.current || !res.data.success) return
      const data = res.data.data as { pins: MapPin[]; total: number; capped: boolean }
      setPins(data.pins)
      setTotal(data.total)
      setCapped(data.capped)
      setFetchedBounds(opts.bounds ?? null)
      if (opts.fit) {
        if (skipFirstFit.current) skipFirstFit.current = false
        else setFitSignal(n => n + 1)
      }
    } catch {
      if (id === requestId.current) toast.error('Failed to load map listings')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [baseParams])

  // A change to the filters or the drawn area starts a fresh, whole-result fetch and re-frames the map.
  useEffect(() => { fetchPins({ fit: true }) }, [fetchPins])

  // Only when there are more matches than the map can draw (or we're already in
  // that windowed mode): follow the viewport, fetching a padded window of it.
  useEffect(() => {
    if (!viewport || (!capped && !fetchedBounds)) return
    if (fetchedBounds && boundsContain(fetchedBounds, viewport.bounds)) return
    const t = setTimeout(() => fetchPins({ bounds: padBounds(viewport.bounds, 0.5) }), 400)
    return () => clearTimeout(t)
  }, [viewport, capped, fetchedBounds, fetchPins])

  // Single-listing view: open its card straight away.
  useEffect(() => {
    if (only && pins.length === 1) setSelectedId(pins[0].id)
  }, [only, pins])

  const showAllListings = () => {
    setOnly('')
    setSelectedId(null)
    window.history.replaceState(null, '', '/map-search')
  }

  // Drop a selection whose pin is no longer in the result set.
  useEffect(() => {
    if (selectedId && !shownPins.some(p => p.id === selectedId)) setSelectedId(null)
  }, [shownPins, selectedId])

  // ── Drive-time search ──────────────────────────────────────────────────
  const commuteOrigins = useMemo<DriveOrigin[]>(
    () => (['A', 'B'] as const).flatMap((tag, i) => {
      const p = commute.places[i]
      return p ? [{ tag, label: p.label, lat: p.lat, lng: p.lng }] : []
    }),
    [commute.places],
  )
  // Just the listing filters — a commute search is bounded by drive time, not by a drawn area.
  const filterParams = useMemo(() => {
    const clean: any = {}
    Object.entries(filters).forEach(([k, v]) => { if (v) clean[k] = v })
    return clean
  }, [filters])

  useEffect(() => {
    if (commuteOrigins.length === 0) { setCommuteResults(null); setCommuteError(''); setCommuteRunning(false); return }
    const id = ++commuteRun.current
    const t = setTimeout(async () => {
      setCommuteRunning(true); setCommuteError('')
      try {
        const max = commute.minutes * 60
        const both = commute.mode === 'both' && commuteOrigins.length === 2
        // Candidates: listings within straight-line reach of each place (a cheap pre-filter before routing).
        const lists: MapPin[][] = await Promise.all(commuteOrigins.map(async o => {
          const res = await propertyAPI.getMapPins({ ...filterParams, lat: o.lat, lng: o.lng, radius: reachKm(commute.minutes) })
          return (res.data.data?.pins ?? []) as MapPin[]
        }))
        let candidates: MapPin[]
        if (both) candidates = lists[0].filter(p => withinReach(commuteOrigins[1], p, commute.minutes))
        else { const seen = new Map<string, MapPin>(); lists.flat().forEach(p => seen.set(p.id, p)); candidates = [...seen.values()] }
        // Keep the request bounded: the 300 nearest to the first place.
        candidates = candidates
          .map(p => ({ p, d: Math.hypot(p.lat - commuteOrigins[0].lat, p.lng - commuteOrigins[0].lng) }))
          .sort((a, b) => a.d - b.d).slice(0, 300).map(x => x.p)
        if (id !== commuteRun.current) return

        const matrix = candidates.length ? await fetchDriveTimes(commuteOrigins, candidates) : { provider: 'osrm' as const, durations: commuteOrigins.map(() => []), distances: commuteOrigins.map(() => []) }
        if (id !== commuteRun.current) return

        const tags = commuteOrigins.map(o => o.tag)
        const scored = candidates.map((p, i) => ({
          ...p,
          drive: { tags, secs: commuteOrigins.map((_, oi) => matrix.durations[oi][i] ?? null), meters: commuteOrigins.map((_, oi) => matrix.distances[oi][i] ?? null) },
        }))
        const ok = (s: number | null) => s !== null && s <= max
        const results = scored
          .filter(p => (both ? p.drive.secs.every(ok) : p.drive.secs.some(ok)))
          .sort((a, b) => {
            const key = (p: typeof a) => (both ? Math.max(...(p.drive.secs as number[])) : Math.min(...(p.drive.secs.filter(s => s !== null) as number[])))
            return key(a) - key(b)
          })
        setCommuteResults(results)
        setCommuteProvider(matrix.provider)
        setSelectedId(null)
        setFitSignal(n => n + 1)
      } catch {
        if (id === commuteRun.current) setCommuteError('Couldn’t work out drive times — please try again')
      } finally {
        if (id === commuteRun.current) setCommuteRunning(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [commuteOrigins, commute.minutes, commute.mode, filterParams])

  // ── Derived ────────────────────────────────────────────────────────────
  const visiblePins = useMemo(
    () => (commuteResults ? commuteResults : area || !viewport ? pins : pins.filter(p => inBounds(p, viewport.bounds))),
    [commuteResults, pins, viewport, area],
  )
  const panelPins = useMemo(
    () => sortPins(visiblePins, sort, viewport?.center ?? DUBAI_CENTER),
    [visiblePins, sort, viewport?.center],
  )
  const stats = useMemo(() => computeStats(visiblePins), [visiblePins])
  const selectedPin = useMemo(() => shownPins.find(p => p.id === selectedId) ?? null, [shownPins, selectedId])

  // Where drive times to the selected property are measured from: the drive-time search's places,
  // else the place picked in the search box, else the visitor's own location.
  const previewOrigins = useMemo<DriveOrigin[]>(() => {
    if (commuteOrigins.length) return commuteOrigins
    if (fromPlace) return [{ tag: 'A', label: fromPlace.label, lat: fromPlace.lat, lng: fromPlace.lng }]
    if (place) return [{ tag: 'A', label: place.label, lat: place.lat, lng: place.lng }]
    if (userLocation) return [{ tag: 'You', label: 'your location', ...userLocation }]
    return []
  }, [commuteOrigins, fromPlace, place, userLocation])

  // Fetch the road route from each start point to the selected property (drawn on the map + listed in the card).
  const originsKey = previewOrigins.map(o => `${o.lat.toFixed(5)},${o.lng.toFixed(5)}`).join('|')
  useEffect(() => {
    if (!selectedPin || previewOrigins.length === 0) { setRoutes([]); setRoutesLoading(false); setRoutesError(false); return }
    let cancelled = false
    setRoutesLoading(true); setRoutesError(false)
    Promise.all(previewOrigins.map(async origin => ({ origin, route: await fetchRoute(origin, selectedPin) })))
      .then(r => { if (!cancelled) setRoutes(r) })
      .catch(() => { if (!cancelled) { setRoutes([]); setRoutesError(true) } })
      .finally(() => { if (!cancelled) setRoutesLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPin?.id, originsKey])

  // ── Handlers ───────────────────────────────────────────────────────────
  const selectFromList = (pin: MapPin) => {
    setSelectedId(pin.id)
    engineRef.current?.panTo(pin.lat, pin.lng, 14)
    setMobileView('map')
  }

  const nearMe = () => {
    if (!navigator.geolocation) { toast.error('Your browser can’t share its location'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserLocation({ lat, lng })
        setArea({ kind: 'circle', lat, lng, radiusKm: 2 })
        setRadiusKm(2)
        setDrawMode('none')
        setLocating(false)
      },
      () => { setLocating(false); toast.error('Location permission was denied') },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const clearArea = () => { setArea(null); setDrawMode('none') }

  const shareView = async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)) })
    Object.entries(encodeAreaForUrl(area)).forEach(([k, v]) => params.set(k, v))
    if (viewport) {
      params.set('c', `${viewport.center.lat.toFixed(5)},${viewport.center.lng.toFixed(5)}`)
      params.set('z', String(viewport.zoom))
    }
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    try { await navigator.clipboard.writeText(url); toast.success('Link to this map view copied') }
    catch { toast.error('Couldn’t copy — copy the address bar instead') }
  }

  const submitQuery = () => setFilter('q', query)

  const goToPlace = (p: ResolvedPlace) => {
    setPlace(p)
    if (filters.q) setFilter('q', '')          // a place isn't a keyword — don't also filter listings by its name
    engineRef.current?.showPlace(p.lat, p.lng, p.label, p.viewport)
  }
  const clearSearch = () => {
    setQuery(''); setPlace(null)
    if (filters.q) setFilter('q', '')
    engineRef.current?.clearPlace()
  }
  return (
    <div className="page">
      <Navbar />

      {/* Navbar renders its own 64px spacer in normal flow (see
          layouts/Navbar.tsx), so this fills what's left of the viewport — on phones also
          leaving room for the site's fixed bottom navigation. */}
      <div className="flex flex-col h-[calc(100vh-128px)] md:h-[calc(100vh-64px)]">
        {/* ── Toolbar ── */}
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
            <span className="hidden sm:inline">Back to list</span>
          </Link>

          <div className="w-px self-stretch flex-shrink-0" style={{ background: 'var(--border)' }} />

          <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            {commuteResults ? `${commuteResults.length.toLocaleString()} within ${commute.minutes} min` : loading && pins.length === 0 ? 'Loading…' : `${(capped ? total : pins.length).toLocaleString()} properties`}
          </span>

          <div className="w-px self-stretch flex-shrink-0 hidden md:block" style={{ background: 'var(--border)' }} />

          {/* View toggle / list collapse — top-right on phones, far right on desktop */}
          <div className="flex items-center gap-1 ml-auto flex-shrink-0 md:order-last">
            {/* Desktop: collapse the results panel */}
            <button
              onClick={() => setPanelOpen(o => !o)}
              className="hidden md:inline-flex btn-ghost btn-sm gap-1.5"
              title={panelOpen ? 'Hide results list' : 'Show results list'}
            >
              {panelOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
              <span className="hidden lg:inline">{panelOpen ? 'Hide list' : 'Show list'}</span>
            </button>
            {/* Mobile: switch between the map and the list */}
            <div className="md:hidden flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {([['map', MapIcon], ['list', List]] as const).map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => setMobileView(v)}
                  className="p-2"
                  aria-label={v === 'map' ? 'Show map' : 'Show list'}
                  style={{ background: mobileView === v ? 'rgba(203,1,1,0.10)' : 'transparent', color: mobileView === v ? 'var(--teal)' : 'var(--text-muted)' }}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          {/* One box: jump the map to a place, or search listings by keyword */}
          <MapPlaceSearch
            query={query}
            onQueryChange={setQuery}
            onSubmitKeyword={submitQuery}
            onClear={clearSearch}
            place={place}
            onPlace={goToPlace}
          />

          {/* Filters: their own scrollable row on phones so the search box above keeps the full width */}
          <div className="flex items-center gap-2 w-full overflow-x-auto md:w-auto md:contents [&>*]:flex-shrink-0 pb-0.5 md:pb-0" style={{ scrollbarWidth: 'none' }}>
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
          <FilterDropdown label="Filters" icon={SlidersHorizontal} active={!!filters.bedrooms || !!filters.priceMin || !!filters.priceMax || !!filters.rentalStatus || !!filters.availableWithin} widthClass="w-64" align="right">
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
                {filters.listingType === 'rent' && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest mb-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Rental availability</p>
                    <div className="flex flex-wrap gap-1.5">
                      {AVAILABILITY_FILTERS.map(o => (
                        <Pill key={o.v} active={(filters.rentalStatus || '') === o.v} onClick={() => setFilter('rentalStatus', o.v)} className="px-2.5 py-1.5">{o.l}</Pill>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {AVAILABLE_WITHIN.filter(o => o.v).map(o => (
                        <Pill key={o.v} active={filters.availableWithin === o.v} onClick={() => setFilter('availableWithin', filters.availableWithin === o.v ? 0 : o.v)} className="px-2.5 py-1.5">{o.l}</Pill>
                      ))}
                    </div>
                  </div>
                )}
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
              onClick={() => { setFilters(f => ({ ...f, type: '', area: '', bedrooms: '', priceMin: 0, priceMax: 0, q: '', rentalStatus: '', availableWithin: 0 })); setQuery('') }}
              className="text-xs flex-shrink-0 px-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Clear
            </button>
          )}
          </div>
        </div>

        {/* ── Panel + map ── */}
        <div className="flex-1 min-h-0 relative flex">
          <aside
            className={cn(
              'flex-shrink-0 min-h-0 md:w-[400px]',
              mobileView === 'list' ? 'absolute inset-0 z-30 md:static md:inset-auto' : 'hidden md:block',
              !panelOpen && 'md:!hidden',
            )}
            style={{ borderRight: '1px solid var(--border)' }}
          >
            <MapListPanel
              pins={panelPins}
              stats={stats}
              sort={sort}
              onSort={setSort}
              selectedId={selectedId}
              hoverId={hoverId}
              onSelect={selectFromList}
              onHover={setHoverId}
              loading={commuteResults ? commuteRunning : loading}
              capped={commuteResults ? false : capped}
              total={commuteResults ? commuteResults.length : total}
              hasArea={!!area || !!commuteResults}
            />
          </aside>

          <div className="flex-1 min-w-0 relative">
            <MapEngine
              engineRef={engineRef}
              pins={shownPins}
              selectedId={selectedId}
              hoverId={hoverId}
              onSelect={setSelectedId}
              onHover={setHoverId}
              onViewportChange={setViewport}
              drawMode={drawMode}
              onDrawModeChange={setDrawMode}
              area={area}
              onAreaChange={a => { setArea(a); if (a?.kind === 'circle') setRadiusKm(a.radiusKm) }}
              radiusKm={radiusKm}
              mapType={mapType}
              traffic={traffic}
              transit={transit}
              colorMode={colorMode}
              clustering={clustering}
              userLocation={userLocation}
              commutePlaces={commuteOrigins.length ? commuteOrigins : fromPlace ? [{ tag: 'A', label: fromPlace.label, lat: fromPlace.lat, lng: fromPlace.lng }] : []}
              routes={routes.map(r => ({ tag: r.origin.tag, path: r.route.path }))}
              onStreetViewChange={setStreetViewOpen}
              initialView={initialView}
              fitSignal={fitSignal}
            />

            {only && !loading && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5 shadow-lg max-w-[calc(100%-1.5rem)]"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <span className="text-xs truncate" style={{ color: 'var(--text-mid)' }}>
                  {pins[0] ? <>Showing <strong style={{ color: 'var(--text)' }}>{pins[0].title}</strong></> : 'This listing has no map location yet'}
                </span>
                <button onClick={showAllListings} className="btn-primary btn-sm whitespace-nowrap flex-shrink-0">Show all listings</button>
              </div>
            )}

            {streetViewOpen ? (
              <button
                onClick={() => engineRef.current?.closeStreetView()}
                className="btn-primary btn-sm gap-1.5 absolute top-3 left-3 z-20 shadow-lg"
              >
                ← Exit Street View
              </button>
            ) : (
              <>
                <MapToolbar
                  drawMode={drawMode}
                  onDrawMode={setDrawMode}
                  area={area}
                  locating={locating}
                  onNearMe={nearMe}
                  onClearArea={clearArea}
                  onFit={() => engineRef.current?.fitToPins()}
                  onShare={shareView}
                  onCommute={() => setCommuteOpen(o => !o)}
                  commuteActive={commuteOpen || commuteOrigins.length > 0}
                />

                {commuteOpen && (
                  <CommutePanel
                    state={commute}
                    onChange={setCommute}
                    running={commuteRunning}
                    resultCount={commuteResults ? commuteResults.length : null}
                    provider={commuteProvider}
                    error={commuteError}
                    hasResults={commuteOrigins.length > 0}
                    onClose={() => setCommuteOpen(false)}
                    onClearResults={() => { setCommute(c => ({ ...c, places: [null, null] })); setCommuteResults(null) }}
                  />
                )}
    
                {area?.kind === 'circle' && drawMode === 'none' && (
                  <RadiusControl
                    area={area}
                    count={pins.length}
                    onRadius={km => { setRadiusKm(km); setArea({ ...area, radiusKm: km }) }}
                  />
                )}
    
                <LayersControl
                  mapType={mapType} onMapType={setMapType}
                  traffic={traffic} onTraffic={setTraffic}
                  transit={transit} onTransit={setTransit}
                  colorMode={colorMode} onColorMode={setColorMode}
                  clustering={clustering} onClustering={setClustering}
                />
    
                {colorMode === 'ppsf' && <HeatLegend />}
    
                {loading && pins.length > 0 && (
                  <div
                    className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full text-[11px] font-semibold shadow"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', marginTop: area?.kind === 'circle' ? 62 : 0 }}
                  >
                    Updating…
                  </div>
                )}
    
                {selectedPin && drawMode === 'none' && (
                  <PinPreviewCard
                    pin={selectedPin}
                    onClose={() => setSelectedId(null)}
                    onStreetView={p => engineRef.current?.openStreetView(p.lat, p.lng) ?? Promise.resolve(false)}
                    routes={routes}
                    routesLoading={routesLoading}
                    routesError={routesError}
                    hasStart={previewOrigins.length > 0}
                    fromPlace={commuteOrigins.length ? null : fromPlace}
                    onFromPlace={setFromPlace}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
