'use client'
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'

// Handover date for the project form: tap a quarter (Q1–Q4), and type the year or pick it from a year grid.
// Covers 10 years back (handed-over projects) to 25 ahead, and any other year can still be typed.
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const THIS_YEAR = new Date().getFullYear()
const PAGE = 18   // years per page of the grid

export default function HandoverPicker({ quarter, year, onChange }: {
  quarter: string
  year: string | number
  onChange: (next: { quarter: string; year: string }) => void
}) {
  const y = String(year ?? '')
  const [open, setOpen] = useState(false)
  const [start, setStart] = useState(() => (Number(y) ? Number(y) - 6 : THIS_YEAR - 3))
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const setYear = (v: string) => onChange({ quarter, year: v.replace(/\D/g, '').slice(0, 4) })
  const valid = !y || (/^\d{4}$/.test(y) && Number(y) >= 1990 && Number(y) <= 2099)
  const years = Array.from({ length: PAGE }, (_, k) => start + k)

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {/* Quarter */}
        <div className="inline-flex p-1 rounded-xl gap-1" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }} role="radiogroup" aria-label="Handover quarter">
          {QUARTERS.map(q => {
            const on = quarter === q
            return (
              <button key={q} type="button" role="radio" aria-checked={on} onClick={() => onChange({ quarter: on ? '' : q, year: y })}
                className="w-11 h-9 rounded-lg text-sm font-bold transition-all"
                style={on ? { background: 'var(--grad)', color: '#fff', boxShadow: '0 4px 10px rgba(203,1,1,0.25)' } : { color: 'var(--text-mid)' }}>
                {q}
              </button>
            )
          })}
        </div>

        {/* Year: type it, or pick it */}
        <div className="relative" ref={box}>
          <div className="flex items-center h-11 rounded-xl overflow-hidden" style={{ border: `1px solid ${valid ? 'var(--border)' : '#F43F5E'}`, background: 'var(--surface)' }}>
            <input
              value={y} onChange={e => setYear(e.target.value)} inputMode="numeric" maxLength={4} placeholder="Year"
              aria-label="Handover year" className="w-20 h-full px-3 bg-transparent outline-none text-sm font-semibold" style={{ color: 'var(--text)' }}
            />
            <button type="button" onClick={() => { setStart(Number(y) ? Number(y) - 6 : THIS_YEAR - 3); setOpen(o => !o) }}
              className="h-full px-3 flex items-center gap-1.5 text-xs font-semibold" style={{ borderLeft: '1px solid var(--border)', color: 'var(--teal)' }}>
              <CalendarDays size={14} /> Pick
            </button>
          </div>
          {open && (
            <div className="absolute z-50 mt-2 w-72 rounded-2xl p-3 shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => setStart(s => s - PAGE)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-alt)]" aria-label="Earlier years"><ChevronLeft size={16} /></button>
                <span className="text-xs font-bold" style={{ color: 'var(--text-mid)' }}>{years[0]} – {years[years.length - 1]}</span>
                <button type="button" onClick={() => setStart(s => s + PAGE)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-alt)]" aria-label="Later years"><ChevronRight size={16} /></button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {years.map(v => {
                  const on = String(v) === y, now = v === THIS_YEAR, past = v < THIS_YEAR
                  return (
                    <button key={v} type="button" onClick={() => { onChange({ quarter, year: String(v) }); setOpen(false) }}
                      className="h-9 rounded-lg text-sm font-semibold transition-all"
                      style={on ? { background: 'var(--grad)', color: '#fff' }
                        : { border: `1px solid ${now ? 'rgba(203,1,1,0.45)' : 'var(--border)'}`, color: past ? 'var(--text-muted)' : 'var(--text)' }}>
                      {v}
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>Earlier years = already handed over. Any other year can be typed.</p>
            </div>
          )}
        </div>

        {(quarter || y) && (
          <button type="button" onClick={() => onChange({ quarter: '', year: '' })} className="h-9 px-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <X size={12} /> Clear
          </button>
        )}
      </div>
      <p className="text-xs" style={{ color: valid ? 'var(--text-muted)' : '#F43F5E' }}>
        {!valid ? 'Enter a 4-digit year, e.g. 2028' : quarter || y ? <>Handover: <strong style={{ color: 'var(--text)' }}>{[quarter, y].filter(Boolean).join(' ')}</strong>{Number(y) && Number(y) < THIS_YEAR ? ' · already handed over' : ''}</> : 'No handover date yet'}
      </p>
    </div>
  )
}
