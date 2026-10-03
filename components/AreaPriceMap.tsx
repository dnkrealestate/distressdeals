'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChartColumnIncreasing, ChevronDown, TrendingUp, Wallet, TrendingDown, Home, BedDouble, Loader2 } from 'lucide-react'
import { areaPricesAPI } from '@/lib/api'
import { loadGoogleMaps, baseMapOptions, useMapTheme, DUBAI_CENTER, GOOGLE_MAPS_API_KEY } from '@/lib/googleMaps'

// "Compare prices by area" — the UAE's real area boundaries (Dubai's official communities and the districts of the
// other emirates, from OpenStreetMap) coloured from light (cheaper) to dark (pricier). Areas without prices yet are
// grey; places outside every drawn boundary (newer developments) show as price bubbles so nothing is lost. Pick an
// area for its highest / average / lowest price. Shapes: /geo/uae-areas.json · prices: GET /area-prices.

interface AreaPrice {
  id: string; name: string; emirate: string; listings: number; projects: number; count: number
  avg: number; min: number; max: number; includes: string[]; linkArea: string; slug: string; lat?: number; lng?: number
  geometry?: { type: string; coordinates: any }
}
type Purpose = 'buy' | 'rent'

const SCALE = ['#CFE8F7', '#9DD0EE', '#62B0DD', '#2F8AC4', '#145E94']   // light → dark = cheaper → pricier
const NO_DATA = '#CBD5E1'
const EMIRATES = ['All UAE', 'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Umm Al Quwain', 'Fujairah']
const TYPES = [{ v: '', l: 'All types' }, { v: 'apartment', l: 'Apartment' }, { v: 'villa', l: 'Villa' }, { v: 'townhouse', l: 'Townhouse' }]
const BEDS = [{ v: '', l: 'Any beds' }, { v: 'studio', l: 'Studio' }, { v: '1', l: '1 Bed' }, { v: '2', l: '2 Beds' }, { v: '3', l: '3 Beds' }, { v: '4', l: '4 Beds' }, { v: '5', l: '5+ Beds' }]

const short = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 2).replace(/\.?0+$/, '')}M` : n >= 1_000 ? `${Math.round(n / 1_000)}K` : String(n))
const aed = (n: number, purpose: Purpose) => `${n.toLocaleString('en-US')} AED${purpose === 'rent' ? '/year' : ''}`

function bucketer(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  if (!sorted.length) return () => 0
  const cut = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]
  const edges = [cut(0.2), cut(0.4), cut(0.6), cut(0.8)]
  return (v: number) => edges.filter(e => v > e).length
}

let shapesCache: Promise<any> | null = null
const loadShapes = () => (shapesCache ??= fetch('/geo/uae-areas.json').then(r => r.json()))

export default function AreaPriceMap({ defaultPurpose = 'buy', title = 'Compare prices by area', subtitle = 'Understand what your budget unlocks across different areas of the UAE.' }: {
  defaultPurpose?: Purpose; title?: string; subtitle?: string
}) {
  const theme = useMapTheme()
  const [purpose, setPurpose] = useState<Purpose>(defaultPurpose)
  const [type, setType] = useState('')
  const [beds, setBeds] = useState('')
  const [emirate, setEmirate] = useState('All UAE')
  const [data, setData] = useState<{ shapes: AreaPrice[]; others: AreaPrice[]; basis: string } | null>(null)
  const [selected, setSelected] = useState<AreaPrice | null>(null)
  const [hoverName, setHoverName] = useState('')
  const [mapState, setMapState] = useState<'loading' | 'ready' | 'error' | 'no-key'>(GOOGLE_MAPS_API_KEY ? 'loading' : 'no-key')
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const featuresRef = useRef<any[]>([])   // mapped boundaries (OSM)
  const genRef = useRef<any[]>([])        // generated outlines for places outside them
  const allFeatures = () => [...featuresRef.current, ...genRef.current]
  const [hoverId, setHoverId] = useState('')

  // Prices
  useEffect(() => {
    let live = true
    setData(null); setSelected(null)
    areaPricesAPI.get({ purpose, type: type || undefined, beds: beds || undefined })
      .then(r => { if (live) setData({ shapes: r.data.data.shapes || [], others: r.data.data.others || [], basis: r.data.data.basis || '' }) })
      .catch(() => { if (live) setData({ shapes: [], others: [], basis: '' }) })
    return () => { live = false }
  }, [purpose, type, beds])

  const all = useMemo(() => [...(data?.shapes || []), ...(data?.others || [])], [data])
  const bucket = useMemo(() => bucketer(all.map(a => a.avg)), [all])
  const priceById = useMemo(() => new Map(all.map(a => [a.id, a])), [all])
  const inEmirate = (a: AreaPrice) => emirate === 'All UAE' || a.emirate === emirate
  const list = useMemo(() => all.filter(inEmirate).sort((a, b) => b.count - a.count), [all, emirate]) // eslint-disable-line react-hooks/exhaustive-deps

  // Map + boundaries (once)
  useEffect(() => {
    if (mapState === 'no-key' || !mapEl.current) return
    let cancelled = false
    Promise.all([loadGoogleMaps(), loadShapes()]).then(([, geo]) => {
      if (cancelled || !mapEl.current) return
      const g = (window as any).google
      const map = new g.maps.Map(mapEl.current, {
        ...baseMapOptions(theme), center: DUBAI_CENTER, zoom: 10, gestureHandling: 'cooperative',
        mapTypeControl: false, streetViewControl: false, fullscreenControl: false, clickableIcons: false,
      })
      mapRef.current = map
      featuresRef.current = map.data.addGeoJson(geo, { idPropertyName: 'id' })
      map.data.addListener('mouseover', (e: any) => { map.data.overrideStyle(e.feature, { strokeWeight: 2.5, strokeColor: '#0F172A' }); setHoverName(e.feature.getProperty('name')); setHoverId(e.feature.getId()) })
      map.data.addListener('mouseout', (e: any) => { map.data.revertStyle(e.feature); setHoverName(''); setHoverId('') })
      map.data.addListener('click', (e: any) => window.dispatchEvent(new CustomEvent('area-map-pick', { detail: e.feature.getId() })))
      setMapState('ready')
    }).catch(() => !cancelled && setMapState('error'))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { if (mapRef.current) mapRef.current.setOptions(baseMapOptions(theme)) }, [theme])

  // Colour the boundaries by price (grey = no prices yet); outline the selected one.
  useEffect(() => {
    const map = mapRef.current
    if (mapState !== 'ready' || !map) return
    map.data.setStyle((f: any) => {
      const a = priceById.get(f.getId())
      const isSel = selected?.id === f.getId()
      const dim = emirate !== 'All UAE' && f.getProperty('emirate') !== emirate
      return {
        fillColor: a ? SCALE[bucket(a.avg)] : NO_DATA,
        fillOpacity: dim ? 0.08 : a ? 0.72 : 0.22,
        strokeColor: isSel ? '#CB0101' : '#FFFFFF',
        strokeWeight: isSel ? 3 : 0.8,
        strokeOpacity: dim ? 0.3 : 1,
        // Priced above unpriced, and smaller areas above the bigger ones they sit inside.
        zIndex: isSel ? 1000 : (a ? 500 : 0) + 100 - Math.min(99, Math.round(f.getProperty('km2') || 0)),
        cursor: a ? 'pointer' : 'default',
      }
    })
  }, [mapState, priceById, bucket, selected, emirate])

  // Places outside every mapped boundary come with a generated outline — draw them as shapes too.
  useEffect(() => {
    const map = mapRef.current
    if (mapState !== 'ready' || !map || !data) return
    for (const f of genRef.current) map.data.remove(f)
    genRef.current = map.data.addGeoJson({
      type: 'FeatureCollection',
      features: data.others.filter(o => o.geometry).map(o => ({ type: 'Feature', id: o.id, geometry: o.geometry, properties: { id: o.id, name: o.name, emirate: o.emirate, generated: true } })),
    })
  }, [mapState, data])

  // Clicks on a boundary
  useEffect(() => {
    const onPick = (e: Event) => {
      const id = (e as CustomEvent).detail as string
      const a = priceById.get(id)
      if (a) select(a)
    }
    window.addEventListener('area-map-pick', onPick)
    return () => window.removeEventListener('area-map-pick', onPick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceById])

  // Frame the chosen emirate (Dubai by default when prices exist there)
  useEffect(() => {
    const map = mapRef.current
    if (mapState !== 'ready' || !map) return
    const g = (window as any).google
    const bounds = new g.maps.LatLngBounds()
    let any = false
    const inScope = (f: any) => emirate === 'All UAE' || f.getProperty('emirate') === emirate
    // Frame the areas that have prices (so shapes are big enough to read); the whole emirate when none do yet.
    for (const f of allFeatures()) {
      if (!inScope(f) || !priceById.has(f.getId())) continue
      f.getGeometry().forEachLatLng((ll: any) => { bounds.extend(ll); any = true })
    }
    if (!any) for (const f of featuresRef.current) {
      if (!inScope(f)) continue
      f.getGeometry().forEachLatLng((ll: any) => { bounds.extend(ll); any = true })
    }
    if (any) {
      const wide = (mapEl.current?.clientWidth || 0) >= 768
      map.fitBounds(bounds, { top: 70, bottom: 30, right: 40, left: wide ? 380 : 30 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapState, emirate, data])

  function select(a: AreaPrice | null) {
    setSelected(a)
    const map = mapRef.current
    if (!a || !map) return
    const g = (window as any).google
    const f = allFeatures().find(x => x.getId() === a.id)
    const wide = (mapEl.current?.clientWidth || 0) >= 768
    if (f) {
      const b = new g.maps.LatLngBounds()
      f.getGeometry().forEachLatLng((ll: any) => b.extend(ll))
      map.fitBounds(b, { top: 90, bottom: 60, right: 80, left: wide ? 400 : 40 })
    } else if (a.lat != null) {
      if (map.getZoom() < 12) map.setZoom(12)
      map.panTo({ lat: a.lat, lng: a.lng })
      if (wide) map.panBy(-170, 0)
    }
  }

  const listingsHref = (a: AreaPrice) => purpose === 'rent'
    ? `/for-rent?area=${encodeURIComponent(a.linkArea)}`
    : a.listings > 0 ? `/for-sale?area=${encodeURIComponent(a.linkArea)}` : `/projects?area=${encodeURIComponent(a.linkArea)}`
  const listingsLabel = (a: AreaPrice) => purpose === 'rent' ? `View ${a.count} rentals` : a.listings > 0 ? `View ${a.listings} properties` : `View ${a.projects} new projects`
  const scopeLabel = emirate === 'All UAE' ? 'UAE' : emirate

  const Select = ({ value, onChange, options, icon: Icon }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[]; icon: any }) => (
    <label className="relative inline-flex items-center h-10 pl-3 pr-8 rounded-full text-sm font-semibold cursor-pointer" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', boxShadow: '0 2px 8px rgba(15,23,42,.08)' }}>
      <Icon size={14} className="mr-1.5" style={{ color: 'var(--teal)' }} />
      <select value={value} onChange={e => onChange(e.target.value)} className="appearance-none bg-transparent outline-none cursor-pointer pr-1" aria-label="Filter">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
    </label>
  )

  return (
    <section className="section">
      <div className="wrap">
        <div className="flex items-start gap-3 mb-2">
          <span className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,1,1,0.08)' }}>
            <ChartColumnIncreasing size={20} style={{ color: 'var(--teal)' }} />
          </span>
          <div>
            <h2 className="heading-md" style={{ color: 'var(--text)' }}>{title}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          </div>
        </div>

        {/* Emirates */}
        <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {EMIRATES.map(e => (
            <button key={e} onClick={() => { setEmirate(e); setSelected(null) }}
              className="flex-shrink-0 px-3.5 h-9 rounded-full text-xs font-semibold transition-colors whitespace-nowrap"
              style={emirate === e ? { background: 'var(--grad)', color: '#fff' } : { background: 'var(--surface)', color: 'var(--text-mid)', border: '1px solid var(--border)' }}>
              {e}
            </button>
          ))}
        </div>

        <div className="relative mt-3 rounded-3xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-alt)' }}>
          {/* Filters — a strip above the map on phones, floating top-right on the map from tablet up */}
          <div className="relative md:absolute md:top-3 md:right-3 z-20 flex flex-wrap gap-2 p-3 md:p-0 justify-start md:justify-end" data-filters
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="inline-flex h-10 p-1 rounded-full" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(15,23,42,.08)' }}>
              {(['buy', 'rent'] as Purpose[]).map(p => (
                <button key={p} onClick={() => setPurpose(p)} className="px-4 rounded-full text-sm font-semibold transition-colors"
                  style={purpose === p ? { background: 'var(--grad)', color: '#fff' } : { color: 'var(--text-mid)' }}>
                  {p === 'buy' ? 'Buy' : 'Rent'}
                </button>
              ))}
            </div>
            <Select value={type} onChange={setType} options={TYPES} icon={Home} />
            <Select value={beds} onChange={setBeds} options={BEDS} icon={BedDouble} />
          </div>

          <div className="flex flex-col md:block relative">
            {/* Map */}
            <div ref={mapEl} className="h-[440px] md:h-[600px] w-full" style={{ background: 'var(--bg-alt)' }} />
            {mapState !== 'ready' && (
              <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
                {mapState === 'no-key' ? 'Map not configured' : mapState === 'error' ? 'The map could not load' : <Loader2 size={18} className="animate-spin" />}
              </div>
            )}
            {hoverName && (
              <div className="hidden md:block absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full text-xs font-semibold pointer-events-none"
                style={{ background: 'rgba(15,23,42,0.85)', color: '#fff' }}>
                {hoverName}{priceById.get(hoverId) ? ` · ${short(priceById.get(hoverId)!.avg)}` : ' · no prices yet'}
              </div>
            )}

            {/* Panel — overlay on desktop, under the map on phones */}
            <div className="md:absolute md:top-16 md:left-4 md:bottom-4 md:w-[340px] z-20 md:rounded-2xl overflow-y-auto flex flex-col"
              style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', boxShadow: '0 12px 32px -12px rgba(15,23,42,.28)' }}>
              {selected ? (
                <div className="p-5 flex flex-col gap-4">
                  <button onClick={() => setSelected(null)} className="inline-flex items-center gap-2 text-sm font-semibold self-start" style={{ color: 'var(--text)' }}>
                    <ArrowLeft size={15} /> Back to {scopeLabel} prices
                  </button>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>{selected.name}</h3>
                    <p className="text-xs mt-0.5 font-semibold" style={{ color: 'var(--teal)' }}>{selected.emirate}</p>
                    {selected.includes.length ? <p className="text-xs mt-1" style={{ color: 'var(--text-mid)' }}>Includes {selected.includes.join(', ')}</p> : null}
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Based on {[selected.listings ? `${selected.listings} listing${selected.listings === 1 ? '' : 's'}` : '', selected.projects ? `${selected.projects} new project${selected.projects === 1 ? '' : 's'}` : ''].filter(Boolean).join(' and ')}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {([['Highest', selected.max, TrendingUp], ['Average', selected.avg, Wallet], ['Lowest', selected.min, TrendingDown]] as const).map(([l, v, I]) => (
                      <div key={l} className="flex items-center gap-3">
                        <I size={16} style={{ color: 'var(--teal)' }} />
                        <span className="text-sm w-20" style={{ color: 'var(--text-muted)' }}>{l}:</span>
                        <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{aed(v, purpose)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>* {data?.basis}{purpose === 'buy' && selected.projects ? ' New projects count with their starting price.' : ''}</p>
                  <div className="flex flex-col gap-2.5 mt-auto">
                    <Link href={`/areas/${selected.slug}`} className="btn-outline justify-center h-11">Explore area</Link>
                    <Link href={listingsHref(selected)} className="btn-primary justify-center h-11">{listingsLabel(selected)}</Link>
                  </div>
                </div>
              ) : (
                <div className="p-5 flex flex-col gap-3">
                  <div>
                    <h3 className="font-bold" style={{ color: 'var(--text)' }}>{scopeLabel} {purpose === 'rent' ? 'rental' : 'sale'} prices</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Tap an area on the map, or pick one below.</p>
                  </div>
                  {data === null ? (
                    <div className="py-8 flex justify-center"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--teal)' }} /></div>
                  ) : list.length === 0 ? (
                    <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
                      {purpose === 'rent' ? 'No rental prices yet — they appear here as rentals are listed.' : `No prices in ${scopeLabel} for this filter yet.`}
                    </p>
                  ) : (
                    <ul className="flex flex-col">
                      {list.slice(0, 8).map(a => (
                        <li key={a.id}>
                          <button onClick={() => select(a)} className="w-full flex items-center gap-3 py-2.5 text-left" style={{ borderBottom: '1px solid var(--border-soft)' }}>
                            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: SCALE[bucket(a.avg)] }} />
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{a.name}</span>
                              <span className="block text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{emirate === 'All UAE' ? `${a.emirate} · ` : ''}{a.count} {purpose === 'rent' ? 'rentals' : a.listings ? 'listings & projects' : 'new projects'}</span>
                            </span>
                            <span className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--text)' }}>{short(a.avg)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {list.length > 0 ? <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Average price · {list.length} areas with prices · {data?.basis}</p> : null}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="hidden md:flex absolute bottom-7 right-4 z-20 items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}>
              <span>Lower</span>
              {SCALE.map(c => <span key={c} className="w-5 h-2.5 rounded-sm" style={{ background: c }} />)}
              <span>Higher</span>
              <span className="ml-1 inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><span className="w-3 h-2.5 rounded-sm" style={{ background: NO_DATA }} /> No data</span>
            </div>
            <p className="absolute bottom-1 right-4 z-10 text-[10px] hidden md:block" style={{ color: 'var(--text-muted)' }}>Area boundaries © OpenStreetMap contributors</p>
          </div>
        </div>
        <p className="md:hidden text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>Area boundaries © OpenStreetMap contributors</p>
      </div>
    </section>
  )
}
