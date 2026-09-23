'use client'
import { Car, X, Loader2 } from 'lucide-react'
import PlacePicker from '@/components/map/PlacePicker'
import { cn } from '@/lib/utils'
import type { ResolvedPlace } from '@/lib/placeSearch'

export const COMMUTE_MINUTES = [10, 15, 20, 30, 45]
export type CommuteMode = 'both' | 'either'

export interface CommuteState {
  places: [ResolvedPlace | null, ResolvedPlace | null]
  minutes: number
  mode: CommuteMode
}

// "Find homes by commute": pick one or two places (work, school, family…) and a drive time, and the
// map shows only the properties you can drive from them within that time.
export default function CommutePanel({
  state, onChange, running, resultCount, provider, error, onClose, onClearResults, hasResults,
}: {
  state: CommuteState
  onChange: (s: CommuteState) => void
  running: boolean
  resultCount: number | null
  provider: string | null
  error: string
  onClose: () => void
  onClearResults: () => void
  hasResults: boolean
}) {
  const placeCount = state.places.filter(Boolean).length
  const setPlace = (i: 0 | 1, p: ResolvedPlace | null) => {
    const places = [...state.places] as CommuteState['places']
    places[i] = p
    onChange({ ...state, places })
  }

  return (
    <div
      className="absolute z-20 top-3 left-14 sm:left-[152px] w-[min(340px,calc(100%-4.5rem))] rounded-2xl shadow-2xl p-3.5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      role="dialog"
      aria-label="Drive-time search"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Car size={15} style={{ color: 'var(--teal)' }} /> Search by drive time
        </h3>
        <button onClick={onClose} aria-label="Close drive-time search" style={{ color: 'var(--text-muted)' }}><X size={15} /></button>
      </div>

      <div className="space-y-2">
        <PlacePicker tag="A" value={state.places[0]} onPick={p => setPlace(0, p)} onClear={() => setPlace(0, null)} placeholder="Work, school, or any place…" />
        <PlacePicker tag="B" value={state.places[1]} onPick={p => setPlace(1, p)} onClear={() => setPlace(1, null)} placeholder="Add a second place (optional)" />
      </div>

      <p className="text-[10px] uppercase tracking-widest font-semibold mt-3.5 mb-1.5" style={{ color: 'var(--text-muted)' }}>Max drive time</p>
      <div className="flex gap-1.5">
        {COMMUTE_MINUTES.map(m => (
          <button
            key={m}
            onClick={() => onChange({ ...state, minutes: m })}
            aria-pressed={state.minutes === m}
            className="flex-1 rounded-lg text-xs font-semibold py-1.5 border transition-all"
            style={{
              borderColor: state.minutes === m ? 'var(--teal)' : 'var(--border)',
              background: state.minutes === m ? 'rgba(203,1,1,0.10)' : 'transparent',
              color: state.minutes === m ? 'var(--teal)' : 'var(--text-muted)',
            }}
          >{m} min</button>
        ))}
      </div>

      {placeCount === 2 && (
        <div className="flex rounded-lg overflow-hidden mt-3" style={{ border: '1px solid var(--border)' }}>
          {([['both', 'Near both'], ['either', 'Near either']] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => onChange({ ...state, mode: v })}
              aria-pressed={state.mode === v}
              className="flex-1 text-xs font-semibold py-1.5"
              style={{ background: state.mode === v ? 'var(--grad)' : 'transparent', color: state.mode === v ? '#fff' : 'var(--text-muted)' }}
            >{label}</button>
          ))}
        </div>
      )}

      <div className="mt-3.5 min-h-[36px] text-xs" style={{ color: 'var(--text-mid)' }} aria-live="polite">
        {placeCount === 0 && <span style={{ color: 'var(--text-muted)' }}>Pick a place to see the properties within {state.minutes} minutes’ drive.</span>}
        {placeCount > 0 && running && <span className="inline-flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Working out drive times…</span>}
        {placeCount > 0 && !running && error && <span style={{ color: '#F43F5E' }}>{error}</span>}
        {placeCount > 0 && !running && !error && resultCount !== null && (
          <span>
            <strong style={{ color: 'var(--text)' }}>{resultCount.toLocaleString()} {resultCount === 1 ? 'property' : 'properties'}</strong>
            {' '}within {state.minutes} min of {placeCount === 2 ? (state.mode === 'both' ? 'both places' : 'either place') : 'your place'}
            {provider === 'estimate' && <span style={{ color: 'var(--text-muted)' }}> · estimated times</span>}
          </span>
        )}
      </div>

      {hasResults && (
        <button onClick={onClearResults} className={cn('btn-ghost btn-sm w-full mt-2')}>Clear drive-time search</button>
      )}
      {provider !== 'google' && (
        <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>Typical drive times without live traffic — rush hour will be longer.</p>
      )}
    </div>
  )
}
