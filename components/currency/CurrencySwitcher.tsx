'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'
import { POPULAR, chooseCurrency, currencyName, rateText, useCurrencyStore } from '@/lib/currency'

// The currency menu in the header: popular currencies first, then every currency we have a rate for (searchable).
export default function CurrencySwitcher({ compact = false, onPicked }: { compact?: boolean; onPicked?: () => void }) {
  const { code, rates } = useCurrencyStore()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close)
  }, [open])
  const list = useMemo(() => {
    const all = Object.keys(rates || { AED: 1 }).filter(c => /^[A-Z]{3}$/.test(c))
    const s = q.trim().toLowerCase()
    const rows = all.filter(c => !s || c.toLowerCase().includes(s) || currencyName(c).toLowerCase().includes(s))
    const pop = POPULAR.filter(c => rows.includes(c))
    return [...pop, ...rows.filter(c => !POPULAR.includes(c)).sort()]
  }, [rates, q])
  const pick = (c: string) => { chooseCurrency(c); setOpen(false); setQ(''); onPicked?.() }

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open} title="Show prices in"
        className={`inline-flex items-center gap-1 rounded-xl text-xs font-bold ${compact ? 'h-9 px-3 w-full justify-between' : 'h-9 px-2.5'}`}
        style={{ border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--surface)' }}>
        {compact && <span className="font-medium" style={{ color: 'var(--text-muted)' }}>Prices in</span>}
        <span>{code}</span>
        <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
      </button>
      {open && (
        <div className={`absolute z-[70] mt-1 w-72 rounded-xl shadow-2xl overflow-hidden ${compact ? 'left-0' : 'right-0'}`} style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} role="listbox">
          <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search currency" className="flex-1 bg-transparent outline-none text-sm" style={{ color: 'var(--text)' }}
              onKeyDown={e => { if (e.key === 'Enter' && list[0]) pick(list[0]); if (e.key === 'Escape') setOpen(false) }} />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {list.map((c, i) => (
              <button key={c} type="button" role="option" aria-selected={c === code} onClick={() => pick(c)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--bg-alt)]"
                style={{ borderTop: !q && i === POPULAR.filter(p => list.includes(p)).length ? '1px solid var(--border)' : undefined }}>
                <span className="w-10 font-bold" style={{ color: 'var(--text)' }}>{c}</span>
                <span className="flex-1 truncate text-xs" style={{ color: 'var(--text-muted)' }}>{currencyName(c)}</span>
                {c === code && <Check size={14} style={{ color: 'var(--teal)' }} />}
              </button>
            ))}
          </div>
          <p className="px-3 py-2 text-[10px]" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>{rateText() ? `${rateText()} today. ` : ''}Prices are set in AED; other currencies are converted at the day&apos;s market rate.</p>
        </div>
      )}
    </div>
  )
}
