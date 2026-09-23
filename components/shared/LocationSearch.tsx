'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'
import { geocodePlace, type GeocodeResult } from '@/lib/distance'

// Location search — type-to-search a place (free OSM Nominatim, no API
// key), pick a suggestion to fill Area/Emirate/coordinates at once. Shared
// by the Property and Project admin listing wizards.
export function LocationSearch({ defaultQuery, onSelect }: { defaultQuery?: string; onSelect: (r: GeocodeResult) => void }) {
  const [query, setQuery] = useState(defaultQuery || '')
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => {
    if (query.trim().length < 3) { setResults([]); return }
    const t = setTimeout(() => {
      setSearching(true)
      geocodePlace(query)
        .then(r => { setResults(r); setOpen(true) })
        .catch(() => {})
        .finally(() => setSearching(false))
    }, 400)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div ref={ref} className="relative">
      <div className="input-glass flex items-center gap-2 h-11 px-3 rounded-xl">
        <Search size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
        <input
          className="bg-transparent flex-1 text-sm outline-none min-w-0"
          placeholder="Search for a location… e.g. Downtown Dubai"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          style={{ color: 'var(--text)' }}
        />
        {searching && <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: 'var(--text-muted)' }} />}
      </div>
      {open && results.length > 0 && (
        <div
          className="absolute z-20 top-full mt-1.5 left-0 right-0 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {results.map((r, i) => (
            <button
              key={i} type="button"
              onClick={() => { onSelect(r); setQuery(r.label); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-xs flex items-start gap-2 transition-colors"
              style={{ color: 'var(--text)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-alt)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <MapPin size={12} style={{ color: 'var(--teal)', marginTop: 2, flexShrink: 0 }} />
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
