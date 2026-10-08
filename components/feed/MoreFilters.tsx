'use client'
import { useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { developerAPI } from '@/lib/api'

// "More filters" — the advanced filters, kept out of the main bar. Each one only uses data the site really has:
// a below-market discount needs a real reference price, a rental yield needs a recorded expected rent, a payment
// plan is recorded on new projects, and "waterfront" reads the listing's own view.
export interface AdvancedFilters { developer?: string; distress?: string; discountMin?: number; waterfront?: string; paymentPlan?: string; roiMin?: number; handoverBy?: number }
export const ADVANCED_KEYS: (keyof AdvancedFilters)[] = ['developer', 'distress', 'discountMin', 'waterfront', 'paymentPlan', 'roiMin', 'handoverBy']

export default function MoreFilters({ value, onChange }: { value: AdvancedFilters; onChange: (patch: AdvancedFilters) => void }) {
  const [open, setOpen] = useState(false)
  const [developers, setDevelopers] = useState<string[]>([])
  const box = useRef<HTMLDivElement>(null)
  const count = ADVANCED_KEYS.filter(k => value[k]).length
  useEffect(() => {
    if (!open || developers.length) return
    developerAPI.getAll().then(r => setDevelopers(((r.data?.data || []) as any[]).map(d => d.name).filter(Boolean).sort())).catch(() => {})
  }, [open, developers.length])
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const year = new Date().getFullYear()
  const toggle = (k: 'distress' | 'waterfront' | 'paymentPlan', label: string, hint: string) => (
    <label className="flex items-start gap-2.5 cursor-pointer py-1.5">
      <input type="checkbox" className="mt-0.5" checked={value[k] === 'true'} onChange={e => onChange({ [k]: e.target.checked ? 'true' : '' })} />
      <span><span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</span><br /><span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{hint}</span></span>
    </label>
  )
  const label = 'block text-[11px] font-semibold uppercase tracking-wide mb-1'
  return (
    <div className="relative" ref={box}>
      <button type="button" onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs font-semibold" aria-label="More filters" title="More filters"
        style={{ border: `1px solid ${count ? 'rgba(203,1,1,0.4)' : 'var(--border)'}`, color: count ? 'var(--teal)' : 'var(--text-mid)', background: count ? 'rgba(203,1,1,0.06)' : 'var(--surface)' }}>
        <SlidersHorizontal size={13} /><span className="hidden sm:inline">More filters</span>{count ? <span>{count}</span> : null}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-[min(92vw,360px)] rounded-2xl p-4 space-y-3 shadow-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>More filters</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="p-1"><X size={15} /></button>
          </div>
          <div>
            <span className={label} style={{ color: 'var(--text-muted)' }}>Developer</span>
            <select className="select-field w-full text-sm" value={value.developer || ''} onChange={e => onChange({ developer: e.target.value })}>
              <option value="">Any developer</option>
              {developers.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={label} style={{ color: 'var(--text-muted)' }}>Below market by</span>
              <select className="select-field w-full text-sm" value={value.discountMin || ''} onChange={e => onChange({ discountMin: Number(e.target.value) || 0 })}>
                <option value="">Any</option>
                {[2, 5, 10, 15, 20].map(n => <option key={n} value={n}>{n}%+</option>)}
              </select>
            </div>
            <div>
              <span className={label} style={{ color: 'var(--text-muted)' }}>Rental yield (ROI)</span>
              <select className="select-field w-full text-sm" value={value.roiMin || ''} onChange={e => onChange({ roiMin: Number(e.target.value) || 0 })}>
                <option value="">Any</option>
                {[5, 6, 7, 8].map(n => <option key={n} value={n}>{n}%+</option>)}
              </select>
            </div>
          </div>
          <div>
            <span className={label} style={{ color: 'var(--text-muted)' }}>Completion by</span>
            <select className="select-field w-full text-sm" value={value.handoverBy || ''} onChange={e => onChange({ handoverBy: Number(e.target.value) || 0 })}>
              <option value="">Any time</option>
              {Array.from({ length: 7 }, (_, i) => year + i).map(y => <option key={y} value={y}>{i0(y, year)}</option>)}
            </select>
          </div>
          <div className="pt-1" style={{ borderTop: '1px solid var(--border-soft)' }}>
            {toggle('distress', 'Distress sale', 'Owners who need to sell soon, as checked by our team')}
            {toggle('paymentPlan', 'Payment plan available', 'New projects with a developer payment plan')}
            {toggle('waterfront', 'Waterfront / sea view', 'Listings whose view is sea, marina, beach, lagoon or creek')}
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>"Below market" and rental yield only use prices and rents our team has documented — never an estimate.</p>
          {count > 0 && (
            <button type="button" className="text-xs font-semibold underline" style={{ color: 'var(--text-muted)' }}
              onClick={() => onChange({ developer: '', distress: '', discountMin: 0, waterfront: '', paymentPlan: '', roiMin: 0, handoverBy: 0 })}>Clear these filters</button>
          )}
        </div>
      )}
    </div>
  )
}
const i0 = (y: number, now: number) => (y === now ? `${y} (ready / this year)` : `${y}`)
