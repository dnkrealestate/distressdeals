import type { MapBounds } from './googleMaps'

// A listing as the map sees it — the compact shape GET /properties/map returns.
export interface MapPin {
  id: string
  slug: string
  ref?: string
  title: string
  price: number
  ppsf?: number            // price per sqft
  lt: 'sale' | 'rent'
  rf?: 'yearly' | 'monthly'
  rs?: 'available_now' | 'available_soon' | 'occupied'   // rent availability (rent pins only)
  af?: string                                           // available-from date (ISO)
  type: string
  beds: number
  baths: number
  size: number             // sqft
  area?: string
  community?: string
  lat: number
  lng: number
  img?: string
  featured: boolean
  offPlan: boolean
  views: number
  created: string
  // New off-plan projects share the map with listings: price is the starting price, and the unit mix is free text.
  kind?: 'project'
  bedsLabel?: string       // e.g. "Studio - 3BR"
  sizeLabel?: string       // e.g. "650 - 1,850 sqft"
  dev?: string             // developer
  handover?: string        // e.g. "Q4 2028"
  handedOver?: boolean     // handover date passed — still shown, just not as "New Project"
  // Set by the drive-time search: how long it takes to drive here from each searched place.
  drive?: { tags: string[]; secs: (number | null)[]; meters: (number | null)[] }
}

export type SearchArea =
  | { kind: 'polygon'; path: [number, number][] }               // [lat, lng] vertices
  | { kind: 'circle'; lat: number; lng: number; radiusKm: number }
  | null

export interface ViewState {
  bounds: MapBounds
  zoom: number
  center: { lat: number; lng: number }
}

export type DrawMode = 'none' | 'polygon' | 'circle'
export type MapType = 'roadmap' | 'satellite' | 'hybrid'
export type ColorMode = 'brand' | 'ppsf'

// ── Formatting ──────────────────────────────────────────────────────────
// "18.5M", "750K", "65K/yr" — compact enough for a map pill.
export function compactPrice(p: Pick<MapPin, 'price' | 'lt' | 'rf'>): string {
  const n = p.price
  let s: string
  if (n >= 1_000_000) s = `${parseFloat((n / 1_000_000).toFixed(2))}M`
  else if (n >= 1_000) s = `${parseFloat((n / 1_000).toFixed(1))}K`
  else s = String(n)
  if (p.lt === 'rent') s += p.rf === 'monthly' ? '/mo' : '/yr'
  return s
}

// Where a pin's "View details" goes.
export const pinHref = (p: Pick<MapPin, 'kind' | 'slug'>) => (p.kind === 'project' ? `/projects/${p.slug}` : `/buyer/properties/${p.slug}`)

export function formatType(type?: string): string {
  return type ? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''
}

// ── Geometry ────────────────────────────────────────────────────────────
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function inBounds(p: { lat: number; lng: number }, b: MapBounds): boolean {
  return p.lat >= b.swLat && p.lat <= b.neLat && p.lng >= b.swLng && p.lng <= b.neLng
}

// Grows a bounding box by `factor` of its own size on every side (fetch a bit
// beyond what's on screen so a small pan doesn't need a refetch).
export function padBounds(b: MapBounds, factor: number): MapBounds {
  const dLat = (b.neLat - b.swLat) * factor, dLng = (b.neLng - b.swLng) * factor
  return { swLat: b.swLat - dLat, swLng: b.swLng - dLng, neLat: b.neLat + dLat, neLng: b.neLng + dLng }
}

export function boundsContain(outer: MapBounds, inner: MapBounds): boolean {
  return inner.swLat >= outer.swLat && inner.neLat <= outer.neLat && inner.swLng >= outer.swLng && inner.neLng <= outer.neLng
}

// ── Market stats for what's currently on screen ─────────────────────────
export interface PinStats {
  lt: 'sale' | 'rent'
  count: number
  avgPrice: number
  medianPrice: number
  minPrice: number
  maxPrice: number
  avgPpsf?: number
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

// Sale and rent prices are different scales, so they're never averaged together.
export function computeStats(pins: MapPin[]): PinStats[] {
  return (['sale', 'rent'] as const)
    .map((lt): PinStats | null => {
      const group = pins.filter(p => p.lt === lt)
      if (group.length === 0) return null
      const prices = group.map(p => p.price)
      const ppsfs = group.map(p => p.ppsf).filter((v): v is number => !!v)
      return {
        lt,
        count: group.length,
        avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        medianPrice: median(prices),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        avgPpsf: ppsfs.length ? ppsfs.reduce((a, b) => a + b, 0) / ppsfs.length : undefined,
      }
    })
    .filter((s): s is PinStats => s !== null)
}

// ── Price-per-sqft heat colours ─────────────────────────────────────────
// Green (cheapest per sqft) → red (priciest), scaled to the 10th–90th percentile
// of what's loaded so one outlier can't wash out every other pin. Sale and rent
// are scaled separately for the same reason as the stats.
export const HEAT_NEUTRAL = '#94A3B8'
export const HEAT_GRADIENT = 'linear-gradient(90deg, hsl(140,70%,42%), hsl(70,75%,45%), hsl(30,80%,48%), hsl(0,75%,45%))'

export function buildHeatScale(pins: MapPin[]): (p: MapPin) => string {
  const ranges: Record<string, { lo: number; hi: number }> = {}
  for (const lt of ['sale', 'rent']) {
    const v = pins.filter(p => p.lt === lt && p.ppsf).map(p => p.ppsf as number).sort((a, b) => a - b)
    if (v.length) ranges[lt] = { lo: v[Math.floor((v.length - 1) * 0.1)], hi: v[Math.floor((v.length - 1) * 0.9)] }
  }
  return p => {
    const r = ranges[p.lt]
    if (!p.ppsf || !r) return HEAT_NEUTRAL
    const t = r.hi === r.lo ? 0.5 : Math.min(1, Math.max(0, (p.ppsf - r.lo) / (r.hi - r.lo)))
    return `hsl(${Math.round(140 - 140 * t)}, 72%, 42%)`
  }
}

// ── Sorting ─────────────────────────────────────────────────────────────
export type PanelSort = 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'ppsf_asc' | 'nearest' | 'views'

export const PANEL_SORTS: { v: PanelSort; l: string }[] = [
  { v: 'featured', l: 'Featured first' },
  { v: 'newest', l: 'Newest' },
  { v: 'price_asc', l: 'Price: low to high' },
  { v: 'price_desc', l: 'Price: high to low' },
  { v: 'ppsf_asc', l: 'Best value (AED/sqft)' },
  { v: 'nearest', l: 'Nearest to map centre' },
  { v: 'views', l: 'Most viewed' },
]

export function sortPins(pins: MapPin[], sort: PanelSort, center: { lat: number; lng: number }): MapPin[] {
  const out = [...pins]
  switch (sort) {
    case 'newest':     return out.sort((a, b) => +new Date(b.created) - +new Date(a.created))
    case 'price_asc':  return out.sort((a, b) => a.price - b.price)
    case 'price_desc': return out.sort((a, b) => b.price - a.price)
    case 'ppsf_asc':   return out.sort((a, b) => (a.ppsf ?? Infinity) - (b.ppsf ?? Infinity))
    case 'views':      return out.sort((a, b) => b.views - a.views)
    case 'nearest':    return out.sort((a, b) => haversineKm(center.lat, center.lng, a.lat, a.lng) - haversineKm(center.lat, center.lng, b.lat, b.lng))
    default:           return out.sort((a, b) => Number(b.featured) - Number(a.featured) || +new Date(b.created) - +new Date(a.created))
  }
}

// ── Drawn area <-> API params / shareable URL ───────────────────────────
export function areaToParams(area: SearchArea): Record<string, string | number> {
  if (!area) return {}
  if (area.kind === 'circle') return { lat: area.lat, lng: area.lng, radius: area.radiusKm }
  return { polygon: area.path.map(([la, ln]) => `${la.toFixed(6)},${ln.toFixed(6)}`).join('|') }
}

export function areaKey(area: SearchArea): string {
  if (!area) return ''
  if (area.kind === 'circle') return `c:${area.lat.toFixed(5)},${area.lng.toFixed(5)},${area.radiusKm.toFixed(2)}`
  return `p:${area.path.map(([a, b]) => `${a.toFixed(5)},${b.toFixed(5)}`).join('|')}`
}

export function encodeAreaForUrl(area: SearchArea): Record<string, string> {
  if (!area) return {}
  if (area.kind === 'circle') return { circle: `${area.lat.toFixed(5)},${area.lng.toFixed(5)},${area.radiusKm.toFixed(2)}` }
  return { poly: area.path.map(([a, b]) => `${a.toFixed(5)},${b.toFixed(5)}`).join('|') }
}

export function decodeAreaFromUrl(params: URLSearchParams): SearchArea {
  const circle = params.get('circle')
  if (circle) {
    const [lat, lng, r] = circle.split(',').map(Number)
    if ([lat, lng, r].every(Number.isFinite) && r > 0) return { kind: 'circle', lat, lng, radiusKm: r }
  }
  const poly = params.get('poly')
  if (poly) {
    const path = poly.split('|').map(pt => pt.split(',').map(Number))
    if (path.length >= 3 && path.every(pt => pt.length === 2 && pt.every(Number.isFinite))) return { kind: 'polygon', path: path as [number, number][] }
  }
  return null
}
