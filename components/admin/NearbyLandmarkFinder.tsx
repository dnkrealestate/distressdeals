'use client'
import { useState } from 'react'
import { TrainFront, HeartPulse, GraduationCap, ShoppingBag, Plane, Landmark, Loader2, Plus, Check, MapPin } from 'lucide-react'
import { nearbyPlaces, type NearbyKind, type NearbyPlace } from '@/lib/googleMaps'
import { haversineKm, formatDistanceKm } from '@/lib/distance'

const KINDS: { kind: NearbyKind; label: string; icon: any }[] = [
  { kind: 'metro', label: 'Metro stations', icon: TrainFront },
  { kind: 'hospital', label: 'Hospitals', icon: HeartPulse },
  { kind: 'school', label: 'Schools', icon: GraduationCap },
  { kind: 'mall', label: 'Malls', icon: ShoppingBag },
  { kind: 'airport', label: 'Airports', icon: Plane },
  { kind: 'landmark', label: 'Major locations', icon: Landmark },
]

// "Find nearby": the project's map pin → the closest metro stations / hospitals / schools / malls / airports / major
// sights from Google Maps, nearest first with the distance; "Add" puts one into the project's landmarks
// (name, type and exact position), which the project page uses for its distance list.
export default function NearbyLandmarkFinder({ lat, lng, added, onAdd }: {
  lat?: number
  lng?: number
  added: string[]                                   // names already in the landmarks list
  onAdd: (l: { name: string; category: NearbyKind; lat: number; lng: number }) => void
}) {
  const [kind, setKind] = useState<NearbyKind | null>(null)
  const [results, setResults] = useState<(NearbyPlace & { km: number })[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const hasPin = Number.isFinite(lat) && Number.isFinite(lng) && !!lat && !!lng

  const search = async (k: NearbyKind) => {
    if (!hasPin) return
    setKind(k); setLoading(true); setError(''); setResults([])
    try {
      const list = await nearbyPlaces({ lat: lat!, lng: lng! }, k)
      setResults(list
        .map(p => ({ ...p, km: haversineKm(lat!, lng!, p.lat, p.lng) }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 10))
    } catch {
      setError('Google Maps couldn’t search right now — try again in a moment.')
    } finally {
      setLoading(false)
    }
  }
  const isAdded = (name: string) => added.some(a => a.trim().toLowerCase() === name.trim().toLowerCase())

  return (
    <div className="rounded-xl p-3.5 mb-3" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
        <MapPin size={13} style={{ color: 'var(--teal)' }} /> Find nearby places from the project’s map pin
      </p>
      {!hasPin ? (
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Set the project location on the map above first — then pick what to look for.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map(({ kind: k, label, icon: Icon }) => (
              <button key={k} type="button" onClick={() => search(k)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                style={kind === k ? { background: 'var(--grad)', color: '#fff' } : { background: 'var(--surface)', color: 'var(--text-mid)', border: '1px solid var(--border)' }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {kind && (
            <div className="mt-3 rounded-lg overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {loading ? (
                <p className="p-3 text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}><Loader2 size={13} className="animate-spin" /> Searching near the project…</p>
              ) : error ? (
                <p className="p-3 text-xs" style={{ color: '#E11D48' }}>{error}</p>
              ) : results.length === 0 ? (
                <p className="p-3 text-xs" style={{ color: 'var(--text-muted)' }}>Nothing found near this location.</p>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-soft)' }}>
                  {results.map(r => {
                    const done = isAdded(r.name)
                    return (
                      <div key={r.placeId} className="flex items-center gap-3 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{r.name}</p>
                          {r.address && <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{r.address}</p>}
                        </div>
                        <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: 'var(--teal)' }}>{formatDistanceKm(r.km)}</span>
                        <button type="button" disabled={done}
                          onClick={() => onAdd({ name: r.name, category: kind, lat: r.lat, lng: r.lng })}
                          className={done ? 'btn-ghost btn-sm gap-1 flex-shrink-0' : 'btn-outline btn-sm gap-1 flex-shrink-0'}>
                          {done ? <><Check size={12} /> Added</> : <><Plus size={12} /> Add</>}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
