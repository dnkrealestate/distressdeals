'use client'
import { useEffect, useRef, useState } from 'react'
import { Search, MapPin, Loader2, X, CornerDownLeft } from 'lucide-react'
import { resolvePlace, searchPlaces, type PlaceSuggestion, type ResolvedPlace } from '@/lib/placeSearch'

// The map page's search box. Type a place → suggestions to jump the map there; press Enter (or the
// first row) to search listings by keyword instead. One box for both, like Bayut / Property Finder.
export default function MapPlaceSearch({
  query, onQueryChange, onSubmitKeyword, onClear, place, onPlace,
}: {
  query: string
  onQueryChange: (v: string) => void
  onSubmitKeyword: () => void
  onClear: () => void
  place: ResolvedPlace | null            // the place currently shown on the map, if any
  onPlace: (p: ResolvedPlace) => void
}) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<PlaceSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [active, setActive] = useState(-1)          // -1 = the keyword row
  const [error, setError] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const lastPicked = useRef('')                     // the text a pick wrote into the box — don't re-search it

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2 || query === lastPicked.current) { setItems([]); setSearching(false); return }
    let cancelled = false
    setSearching(true)
    const t = setTimeout(() => {
      searchPlaces(query)
        .then(r => { if (!cancelled) { setItems(r); setActive(-1); setError(''); setOpen(true) } })
        .catch(() => { if (!cancelled) { setItems([]); setError('Place search is unavailable right now') } })
        .finally(() => { if (!cancelled) setSearching(false) })
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
  }, [query])

  async function pick(s: PlaceSuggestion) {
    setResolving(true)
    try {
      const resolved = await resolvePlace(s)
      lastPicked.current = resolved.label
      onQueryChange(resolved.label)
      onPlace(resolved)
      setOpen(false)
      setItems([])
    } catch {
      setError('Couldn’t find that place — try another')
    } finally {
      setResolving(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(a + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, -1)) }
    else if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (active >= 0 && items[active]) pick(items[active])
      else { setOpen(false); onSubmitKeyword() }
    }
  }

  const showDropdown = open && query.trim().length >= 2 && query !== lastPicked.current

  return (
    <div ref={ref} className="relative min-w-0 w-full md:w-auto md:flex-1 md:max-w-sm">
      <div className="input-glass flex items-center gap-2 h-9 px-3 rounded-lg">
        {place && query === place.label
          ? <MapPin size={13} style={{ color: 'var(--teal)', flexShrink: 0 }} />
          : <Search size={13} style={{ color: 'var(--teal)', flexShrink: 0 }} />}
        <input
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-label="Search a place or keyword"
          value={query}
          onChange={e => { lastPicked.current = ''; onQueryChange(e.target.value); setOpen(true) }}
          onFocus={() => items.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search a place, area or keyword…"
          className="bg-transparent flex-1 text-sm outline-none min-w-0"
          style={{ color: 'var(--text)' }}
        />
        {(searching || resolving) && <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: 'var(--text-muted)' }} />}
        {(query || place) && (
          <button onClick={() => { lastPicked.current = ''; setItems([]); setOpen(false); onClear() }} aria-label="Clear search" style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <X size={12} style={{ color: 'var(--text-muted)' }} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute z-50 top-full mt-1.5 left-0 right-0 min-w-[280px] rounded-xl shadow-lg overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          role="listbox"
        >
          <button
            type="button"
            onClick={() => { setOpen(false); onSubmitKeyword() }}
            className="w-full text-left px-3 py-2.5 text-xs flex items-center gap-2 transition-colors"
            style={{ color: 'var(--text)', background: active === -1 ? 'var(--bg-alt)' : 'transparent' }}
          >
            <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span className="flex-1 min-w-0 truncate">Search listings for “{query.trim()}”</span>
            <CornerDownLeft size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </button>

          {items.length > 0 && (
            <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-soft)' }}>Places</p>
          )}
          {items.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={active === i}
              onClick={() => pick(s)}
              onMouseEnter={() => setActive(i)}
              className="w-full text-left px-3 py-2 text-xs flex items-start gap-2 transition-colors"
              style={{ color: 'var(--text)', background: active === i ? 'var(--bg-alt)' : 'transparent' }}
            >
              <MapPin size={12} style={{ color: 'var(--teal)', marginTop: 2, flexShrink: 0 }} />
              <span className="min-w-0">
                <span className="block font-medium truncate">{s.main}</span>
                {s.secondary && <span className="block truncate" style={{ color: 'var(--text-muted)' }}>{s.secondary}</span>}
              </span>
            </button>
          ))}
          {error && <p className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>{error}</p>}
        </div>
      )}
    </div>
  )
}
