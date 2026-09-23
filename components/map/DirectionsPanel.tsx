'use client'
import { useState } from 'react'
import { Car, ChevronDown, ChevronUp, Loader2, Flag } from 'lucide-react'
import PlacePicker from '@/components/map/PlacePicker'
import { formatDrive, formatKm, TAG_COLORS, type RouteView } from '@/lib/driveTime'
import type { ResolvedPlace } from '@/lib/placeSearch'

// Directions to the selected property, shown inside the preview card (the route itself is drawn on our map):
// time + distance from each start point, a "start from" search box, and the turn-by-turn steps.
export default function DirectionsPanel({
  routes, loading, error, fromPlace, onFromPlace, stepsOpen, onToggleSteps, hasStart,
}: {
  routes: RouteView[]
  loading: boolean
  error: boolean
  fromPlace: ResolvedPlace | null
  onFromPlace: (p: ResolvedPlace | null) => void
  stepsOpen: boolean
  onToggleSteps: () => void
  hasStart: boolean                       // some start point exists (search place, drive-time A/B, my location…)
}) {
  const [changing, setChanging] = useState(false)
  const showPicker = !hasStart || !!fromPlace || changing
  const multi = routes.length > 1

  return (
    <div className="px-3 py-2.5 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
      {showPicker && (
        <PlacePicker
          tag="A"
          value={fromPlace}
          onPick={p => { onFromPlace(p); setChanging(false) }}
          onClear={() => { onFromPlace(null); setChanging(false) }}
          placeholder="Directions from… search a place"
        />
      )}

      {loading && (
        <p className="text-[11px] inline-flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Loader2 size={11} className="animate-spin" /> Finding the route…
        </p>
      )}
      {error && !loading && <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Directions aren’t available right now.</p>}

      {routes.map(({ origin, route }) => (
        <div key={`${origin.tag}-${origin.lat}-${origin.lng}`} className="space-y-1">
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-mid)' }}>
            {multi
              ? <span className="w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0" style={{ background: TAG_COLORS[origin.tag] }}>{origin.tag}</span>
              : <Car size={13} style={{ color: 'var(--teal)', flexShrink: 0 }} />}
            <span className="min-w-0">
              <strong style={{ color: 'var(--text)' }}>{route.provider === 'estimate' ? '≈ ' : ''}{formatDrive(route.duration)}</strong>
              {' · '}{formatKm(route.distance)} from <span className="font-medium">{origin.label}</span>
            </span>
          </div>

          {stepsOpen && route.steps.length > 0 && (
            <ol className="max-h-44 overflow-y-auto rounded-lg py-1" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border-soft)' }}>
              {route.steps.map((s, i) => {
                const last = i === route.steps.length - 1
                return (
                  <li key={i} className="flex items-start gap-2 px-2 py-1 text-[11px]">
                    <span
                      className="w-4 h-4 mt-px rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold text-white"
                      style={{ background: last ? '#16a34a' : TAG_COLORS[origin.tag] ?? 'var(--teal)' }}
                    >{last ? <Flag size={8} /> : i + 1}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block" style={{ color: 'var(--text)' }}>{s.text}</span>
                      {s.road && <span className="block truncate" style={{ color: 'var(--text-muted)' }} dir="auto">{s.road}</span>}
                    </span>
                    {s.distance > 0 && <span className="flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{formatKm(s.distance)}</span>}
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      ))}

      {routes.length > 0 && (
        <div className="flex items-center justify-between">
          <button onClick={onToggleSteps} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--teal)' }}>
            {stepsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />} {stepsOpen ? 'Hide' : 'Show'} step-by-step directions
          </button>
          {!showPicker && (
            <button onClick={() => setChanging(true)} className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Change start</button>
          )}
        </div>
      )}
    </div>
  )
}
