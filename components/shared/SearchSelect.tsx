'use client'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X, Check } from 'lucide-react'

export interface SearchOption { value: string; label: string; hint?: string; group?: string }

// A select you can type into: the list narrows as you type (label, hint and group all match), arrow keys + Enter
// pick, Esc closes. Optional footer (e.g. "Add new developer") and a clear button.
export default function SearchSelect({
  value, onChange, options, placeholder = 'Select…', searchPlaceholder = 'Type to search…', footer, clearable = true,
  invalid, disabled, emptyText = 'No matches',
}: {
  value: string
  onChange: (value: string) => void
  options: SearchOption[]
  placeholder?: string
  searchPlaceholder?: string
  footer?: React.ReactNode
  clearable?: boolean
  invalid?: boolean
  disabled?: boolean
  emptyText?: string
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const pop = useRef<HTMLDivElement>(null)
  // The list floats above the page (portal + fixed position), so no card / modal with overflow:hidden can cut it
  // off. It opens downward, or upward when there isn't room below.
  const [pos, setPos] = useState<React.CSSProperties>({})
  const place = () => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return
    const width = Math.max(r.width, 240)
    const left = Math.min(r.left, window.innerWidth - width - 8)
    const below = window.innerHeight - r.bottom
    setPos(below < 340 && r.top > below
      ? { position: 'fixed', left, width, bottom: window.innerHeight - r.top + 6 }
      : { position: 'fixed', left, width, top: r.bottom + 6 })
  }
  useLayoutEffect(() => {
    if (!open) return
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place) }
  }, [open])

  const selected = options.find(o => o.value === value)
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return options
    const words = t.split(/\s+/)
    return options.filter(o => {
      const hay = `${o.label} ${o.hint || ''} ${o.group || ''}`.toLowerCase()
      return words.every(w => hay.includes(w))
    })
  }, [options, q])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { const t = e.target as Node; if (!box.current?.contains(t) && !pop.current?.contains(t)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    setTimeout(() => input.current?.focus(), 0)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])
  useEffect(() => { setHi(0) }, [q, open])
  useEffect(() => { listRef.current?.querySelector<HTMLElement>(`[data-i="${hi}"]`)?.scrollIntoView({ block: 'nearest' }) }, [hi])

  const pick = (v: string) => { onChange(v); setOpen(false); setQ('') }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(i => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[hi]) pick(filtered[hi].value) }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
  }

  // Bold the typed text inside each option.
  const mark = (text: string) => {
    const t = q.trim()
    if (!t) return text
    const i = text.toLowerCase().indexOf(t.toLowerCase())
    if (i < 0) return text
    return <>{text.slice(0, i)}<strong style={{ color: 'var(--teal)' }}>{text.slice(i, i + t.length)}</strong>{text.slice(i + t.length)}</>
  }

  let lastGroup: string | undefined
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || /^[\w ]$/.test(e.key))) { e.preventDefault(); setOpen(true); if (/^[\w ]$/.test(e.key)) setQ(e.key) } }}
        className="select-field w-full flex items-center gap-2 text-left disabled:opacity-60"
        style={invalid ? { borderColor: '#FB7185' } : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex-1 min-w-0 truncate" style={{ color: selected || value ? 'var(--text)' : 'var(--text-muted)' }}>
          {selected ? selected.label : value || placeholder}
        </span>
        {clearable && value && (
          <span role="button" tabIndex={-1} aria-label="Clear" onClick={e => { e.stopPropagation(); onChange('') }}
            className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-[var(--bg-alt)] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            <X size={12} />
          </span>
        )}
        <ChevronDown size={14} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div ref={pop} className="z-[150] rounded-xl shadow-xl overflow-hidden"
          style={{ ...pos, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 px-3 h-10" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <Search size={13} style={{ color: 'var(--teal)' }} />
            <input ref={input} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey} placeholder={searchPlaceholder}
              className="flex-1 bg-transparent outline-none text-sm min-w-0" style={{ color: 'var(--text)' }} />
            {q && <button type="button" onClick={() => setQ('')} style={{ color: 'var(--text-muted)' }}><X size={12} /></button>}
          </div>
          <div ref={listRef} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && <p className="px-3 py-3 text-xs text-center" style={{ color: 'var(--text-muted)' }}>{emptyText}</p>}
            {filtered.map((o, i) => {
              const header = o.group && o.group !== lastGroup ? o.group : null
              lastGroup = o.group
              return (
                <div key={`${o.group || ''}:${o.value}`}>
                  {header && <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{header}</p>}
                  <button type="button" data-i={i} role="option" aria-selected={o.value === value}
                    onMouseEnter={() => setHi(i)} onClick={() => pick(o.value)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm"
                    style={{ background: i === hi ? 'var(--bg-alt)' : 'transparent', color: 'var(--text)' }}>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{mark(o.label)}</span>
                      {o.hint && <span className="block text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{o.hint}</span>}
                    </span>
                    {o.value === value && <Check size={14} style={{ color: 'var(--teal)' }} />}
                  </button>
                </div>
              )
            })}
          </div>
          {footer && <div className="px-3 py-2 text-xs" style={{ borderTop: '1px solid var(--border-soft)' }}>{footer}</div>}
        </div>,
        document.body,
      )}
    </div>
  )
}
