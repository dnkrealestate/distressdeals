'use client'
import { Calendar } from 'lucide-react'
import { RENTAL_STATUS_OPTIONS, todayInput } from '@/lib/rental'
import type { RentalStatus } from '@/types'

// Rent listings: is the unit vacant now, vacant from a date, or still tenanted (and free from when).
// Controlled — used by the seller wizard, the admin property form and the dashboard quick-edit card.
export default function RentalAvailabilityFields({
  status, date, onStatus, onDate, showError = false,
}: {
  status: RentalStatus
  date: string                       // yyyy-mm-dd, '' when unset
  onStatus: (v: RentalStatus) => void
  onDate: (v: string) => void
  showError?: boolean                // highlight the date when it is required but empty
}) {
  const needsDate = status !== 'available_now'
  const dateLabel = status === 'occupied' ? 'Lease ends / free from' : 'Available from'
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {RENTAL_STATUS_OPTIONS.map(o => {
          const active = status === o.v
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onStatus(o.v)}
              className="text-left rounded-xl border px-3.5 py-3 transition-all"
              style={{
                borderColor: active ? 'var(--teal)' : 'var(--border)',
                background: active ? 'rgba(203,1,1,0.08)' : 'transparent',
              }}
            >
              <span className="block text-xs font-semibold" style={{ color: active ? 'var(--teal)' : 'var(--text)' }}>{o.l}</span>
              <span className="block text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>{o.hint}</span>
            </button>
          )
        })}
      </div>

      {needsDate && (
        <div>
          <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-mid)' }}>
            <Calendar size={12} /> {dateLabel} *
          </label>
          <input
            className="input"
            type="date"
            min={todayInput()}
            value={date}
            onChange={e => onDate(e.target.value)}
            style={showError && !date ? { borderColor: '#FB7185' } : undefined}
          />
          {showError && !date && (
            <p className="text-xs mt-1" style={{ color: '#FB7185' }}>Please choose the date it becomes available</p>
          )}
        </div>
      )}
    </div>
  )
}
