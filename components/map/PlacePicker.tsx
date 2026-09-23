'use client'
import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2, X, LocateFixed } from 'lucide-react'
import toast from 'react-hot-toast'
import { resolvePlace, searchPlaces, type PlaceSuggestion, type ResolvedPlace } from '@/lib/placeSearch'
import { TAG_COLORS } from '@/lib/driveTime'

// One "pick a place" field for the drive-time panel: autocomplete, or "use my location".
export default function PlacePicker({
  tag, value, onPick, onClear, placeholder,
}: {
  tag: string                                   // "A" / "B"
  value: ResolvedPlace | null
  onPick: (p: ResolvedPlace) => void
  onClear: () => void
  placeholder: string
}) {
  const [text, setText] = useState(value?.label ?? '')
  const [items, setItems] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const picked = useRef(value?.label ?? '')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { if (!value) { picked.current = ''; setText('') } }, [value])

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => {
    if (text.trim().length < 2 || text === picked.current) { setItems([]); return }
    let cancelled = false
    const t = setTimeout(() => {
      setBusy(true)
      searchPlaces(text)
        .then(r => { if (!cancelled) { setItems(r); setOpen(true) } })
        .catch(() => { if (!cancelled) setItems([]) })
        .finally(() => { if (!cancelled) setBusy(false) })
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
  }, [text])

  async function pick(s: PlaceSuggestion) {
    setBusy(true)
    try {
      const p = await resolvePlace(s)
      picked.current = p.label
      setText(p.label); setOpen(false); setItems([])
      onPick(p)
    } catch {
      toast.error('Couldn’t find that place — try another')
    } finally { setBusy(false) }
  }

  function useMyLocation() {
    if (!navigator.geolocation) { toast.error('Your browser can’t share its location'); return }
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const p = { label: 'My location', lat: pos.coords.latitude, lng: pos.coords.longitude }
        picked.current = p.label; setText(p.label); setBusy(false); onPick(p)
      },
      () => { setBusy(false); toast.error('Location permission was denied') },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div ref={ref} className="relative">
      <div className="input-glass flex items-center gap-2 h-10 pl-1.5 pr-2 rounded-lg">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
          style={{ background: TAG_COLORS[tag] }}
        >{tag}</span>
        <input
          value={text}
          onChange={e => { picked.current = ''; setText(e.target.value); setOpen(true) }}
          onFocus={() => items.length > 0 && setOpen(true)}
          placeholder={placeholder}
          aria-label={`Place ${tag}`}
          className="bg-transparent flex-1 text-sm outline-none min-w-0"
          style={{ color: 'var(--text)' }}
        />
        {busy && <Loader2 size={13} className="animate-spin flex-shrink-0" style={{ color: 'var(--text-muted)' }} />}
        {(text || value) ? (
          <button onClick={() => { picked.current = ''; setText(''); setItems([]); onClear() }} aria-label={`Clear place ${tag}`} className="flex-shrink-0">
            <X size={13} style={{ color: 'var(--text-muted)' }} />
          </button>
        ) : (
          <button onClick={useMyLocation} aria-label="Use my location" title="Use my location" className="flex-shrink-0">
            <LocateFixed size={14} style={{ color: 'var(--teal)' }} />
          </button>
        )}
      </div>

      {open && items.length > 0 && (
        <div className="absolute z-30 top-full mt-1 left-0 right-0 rounded-xl shadow-lg overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {items.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s)}
              className="w-full text-left px-3 py-2 text-xs flex items-start gap-2 hover:bg-[var(--bg-alt)]"
              style={{ color: 'var(--text)' }}
            >
              <MapPin size={12} style={{ color: 'var(--teal)', marginTop: 2, flexShrink: 0 }} />
              <span className="min-w-0">
                <span className="block font-medium truncate">{s.main}</span>
                {s.secondary && <span className="block truncate" style={{ color: 'var(--text-muted)' }}>{s.secondary}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
