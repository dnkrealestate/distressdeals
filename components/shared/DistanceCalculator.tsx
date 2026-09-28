'use client'
import { useState } from 'react'
import { Loader2, Navigation, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { haversineKm, formatDistanceKm, geocodePlace, type GeocodeResult } from '@/lib/distance'

// "How far is it to …?" on the project and property pages. On phones the box and button stack (the long placeholder
// used to push the button off-screen), and the result wraps instead of being cut off.
export default function DistanceCalculator({ lat, lng }: { lat: number; lng: number }) {
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ place: GeocodeResult; km: number } | null>(null)

  const calculate = async () => {
    if (!query.trim()) return
    setBusy(true); setResult(null)
    try {
      const found = await geocodePlace(query.trim())
      if (!found.length) { toast.error('Place not found — try a fuller name'); return }
      setResult({ place: found[0], km: haversineKm(lat, lng, found[0].lat, found[0].lng) })
    } catch {
      toast.error('Could not calculate the distance — try again')
    } finally { setBusy(false) }
  }

  return (
    <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--bg-alt)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Navigation size={15} style={{ color: 'var(--teal)' }} />
        <h4 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Calculate distance to any place</h4>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="input-glass flex items-center gap-2 h-11 px-3 rounded-xl flex-1 min-w-0">
          <Search size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && calculate()}
            placeholder="e.g. Dubai Mall, DXB Airport"
            enterKeyHint="search"
            className="bg-transparent flex-1 text-sm outline-none min-w-0 w-full"
            style={{ color: 'var(--text)' }}
          />
          {query && <button type="button" onClick={() => { setQuery(''); setResult(null) }} aria-label="Clear" style={{ color: 'var(--text-muted)' }}><X size={14} /></button>}
        </div>
        <button onClick={calculate} disabled={busy || !query.trim()} className="btn-primary h-11 justify-center gap-1.5 w-full sm:w-auto flex-shrink-0 disabled:opacity-60">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Calculate
        </button>
      </div>
      {result && (
        <div className="mt-3 flex items-start justify-between gap-3 p-3 rounded-xl" style={{ background: 'rgba(203,1,1,0.08)' }}>
          <p className="text-xs leading-snug min-w-0 break-words" style={{ color: 'var(--text-mid)' }}>{result.place.label}</p>
          <p className="text-sm font-bold flex-shrink-0 whitespace-nowrap" style={{ color: 'var(--teal)' }}>{formatDistanceKm(result.km)}</p>
        </div>
      )}
    </div>
  )
}
