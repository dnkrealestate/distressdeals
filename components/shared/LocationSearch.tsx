'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Loader2, Building2 } from 'lucide-react'
import { geocodePlace, type GeocodeResult } from '@/lib/distance'
import { GOOGLE_MAPS_API_KEY, newPlacesSession, searchPlaces, getPlaceDetails } from '@/lib/googleMaps'

// Location search — type a project, building, tower, street or area and pick a suggestion to fill
// Area/Emirate/coordinates at once. Uses Google Places (knows building and project names); falls back to
// OpenStreetMap's Nominatim when Google isn't available. Shared by the Property and Project admin wizards.
type Suggestion = { key: string; main: string; secondary: string; resolve: () => Promise<GeocodeResult> }

export function LocationSearch({ defaultQuery, onSelect }: { defaultQuery?: string; onSelect: (r: GeocodeResult) => void }) {
  const [query, setQuery] = useState(defaultQuery || '')
  const [results, setResults] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [picking, setPicking] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const session = useRef<any>(null)
  const googleOk = useRef(!!GOOGLE_MAPS_API_KEY)
  // Picking a suggestion writes its label into the box — that must not trigger a fresh search.
  const skipNext = useRef(false)

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return }
    if (query.trim().length < 2) { setResults([]); return }
    let cancelled = false
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const list = await search(query.trim())
        if (!cancelled) { setResults(list); setOpen(true) }
      } catch { /* leave the previous suggestions */ }
      finally { if (!cancelled) setSearching(false) }
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [query])

  async function search(q: string): Promise<Suggestion[]> {
    if (googleOk.current) {
      try {
        session.current ??= await newPlacesSession()
        const token = session.current
        const preds = await searchPlaces(q, token)
        return preds.map(p => ({
          key: p.placeId, main: p.main, secondary: p.secondary,
          resolve: async () => {
            const d = await getPlaceDetails(p.placeId, token)
            return { label: d.label, lat: d.lat, lng: d.lng, area: d.area, road: d.road, name: d.name, emirate: d.emirate }
          },
        }))
      } catch {
        googleOk.current = false // key/quota problem — use OpenStreetMap for the rest of this visit
      }
    }
    const r = await geocodePlace(q)
    return r.map((g, i) => {
      const [main, ...rest] = g.label.split(',')
      return { key: `osm-${i}`, main: main.trim(), secondary: rest.join(',').trim(), resolve: async () => g }
    })
  }

  const pick = async (s: Suggestion) => {
    setOpen(false); setPicking(true)
    try {
      const r = await s.resolve()
      skipNext.current = true
      setQuery(s.secondary ? `${s.main}, ${s.secondary}` : s.main)
      onSelect(r)
    } catch { /* details lookup failed — keep the box open for another try */ setOpen(true) }
    finally { setPicking(false); session.current = null }
  }

  return (
    <div ref={ref} className="relative">
      <div className="input-glass flex items-center gap-2 h-11 px-3 rounded-xl">
        <Search size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
        <input
          className="bg-transparent flex-1 text-sm outline-none min-w-0"
          placeholder="Search project, building, tower or area… e.g. Marina Gate"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          style={{ color: 'var(--text)' }}
        />
        {(searching || picking) && <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: 'var(--text-muted)' }} />}
      </div>
      {open && results.length > 0 && (
        <div
          className="absolute z-20 top-full mt-1.5 left-0 right-0 rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {results.map(s => (
            <button
              key={s.key} type="button"
              onClick={() => pick(s)}
              className="w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors"
              style={{ color: 'var(--text)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-alt)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {googleOk.current
                ? <Building2 size={13} style={{ color: 'var(--teal)', marginTop: 2, flexShrink: 0 }} />
                : <MapPin size={13} style={{ color: 'var(--teal)', marginTop: 2, flexShrink: 0 }} />}
              <span className="min-w-0">
                <span className="block text-xs font-semibold truncate">{s.main}</span>
                {s.secondary && <span className="block text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{s.secondary}</span>}
              </span>
            </button>
          ))}
          {googleOk.current && (
            <p className="px-3 py-1.5 text-[10px] text-right" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-soft)' }}>powered by Google</p>
          )}
        </div>
      )}
    </div>
  )
}
